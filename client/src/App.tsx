import { useEffect, useEffectEvent, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, Calculator, Check, ChevronRight, CircleHelp, Clock3,
  Compass, FlaskConical, Globe, Landmark, Lightbulb, MapPin, Minus, Mountain,
  Plus, RotateCcw, Sparkles, Trophy, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import './experience.css'

type AgeGroup = '<6' | '6-12' | '13-16' | '>16'
type View = 'home' | 'setup' | 'playing' | 'results' | 'history'
type Theme = { id: string; name: string; description: string; questionCount: number; accent: string }
type Question = {
  id: string; themeId: string; themeName: string; ageGroup: AgeGroup; difficulty: string
  type: string; prompt: string; options: { id: string; text: string }[]; timeLimitSeconds: number
}
type Session = { sessionId: string; totalQuestions: number; firstQuestion: Question }
type Feedback = {
  questionId: string; isCorrect: boolean; correctAnswer: string; explanation: string
  questionNumber: number; totalQuestions: number; isSessionComplete: boolean; nextQuestion: Question | null
}
type Summary = {
  sessionId: string; totalQuestions: number; correctAnswers: number; scorePercentage: number
  averageSecondsPerQuestion: number; performanceLevel: string; heroTrophyEarned: boolean
}
type HistoryEntry = {
  id: string; date: string; scorePercentage: number; correctAnswers: number
  totalQuestions: number; themes: string[]; heroTrophyEarned: boolean
}

const ageGroups: { id: AgeGroup; title: string; range: string; tone: string; icon: LucideIcon }[] = [
  { id: '<6', title: 'Petits curieux', range: 'Moins de 6 ans', tone: 'peach', icon: Sparkles },
  { id: '6-12', title: 'Jeunes explorateurs', range: '6 à 12 ans', tone: 'green', icon: Compass },
  { id: '13-16', title: 'Esprits vifs', range: '13 à 16 ans', tone: 'blue', icon: Lightbulb },
  { id: '>16', title: 'Curieux de tout', range: 'Plus de 16 ans', tone: 'lavender', icon: Mountain },
]
const themeIcons: Record<string, LucideIcon> = {
  'canada-history': Landmark, 'canada-geography': MapPin, 'world-geography': Globe,
  science: FlaskConical, math: Calculator, astronomy: Sparkles, religion: BookOpen,
}
const historyKey = 'curio-history'

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { detail?: string; title?: string } | null
    throw new Error(error?.detail ?? error?.title ?? 'Le service est momentanément indisponible.')
  }
  return response.json() as Promise<T>
}

function getHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(historyKey) ?? '[]') as HistoryEntry[] } catch { return [] }
}

function App() {
  const [view, setView] = useState<View>('home')
  const [themes, setThemes] = useState<Theme[]>([])
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('6-12')
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([])
  const [numberOfQuestions, setNumberOfQuestions] = useState(5)
  const [saveSession, setSaveSession] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>(getHistory)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const answerLock = useRef(false)

  useEffect(() => {
    request<Theme[]>('/themes').then(setThemes).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Connexion impossible à l’API.')
    })
  }, [])

  useEffect(() => {
    if (view !== 'playing' || !question || feedback) return
    const timer = window.setInterval(() => {
      setSecondsLeft((remaining) => Math.max((remaining ?? question.timeLimitSeconds) - 1, 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [view, question, feedback])

  const submitExpiredQuestion = useEffectEvent(() => {
    void submitAnswer(null)
  })

  useEffect(() => {
    if (view === 'playing' && question && !feedback && secondsLeft === 0 && !busy) {
      submitExpiredQuestion()
    }
  }, [view, question, feedback, secondsLeft, busy])

  const selectedThemes = themes.filter((theme) => selectedThemeIds.includes(theme.id))
  const availableCount = selectedThemeIds.length * (ageGroup === '6-12' ? 2 : 1)

  function openSetup(preselected?: string, nextAgeGroup = ageGroup) {
    const nextThemes = preselected ? [preselected] : themes.map((theme) => theme.id)
    setSelectedThemeIds(nextThemes)
    setNumberOfQuestions(Math.min(5, nextThemes.length * (nextAgeGroup === '6-12' ? 2 : 1)))
    setError('')
    setView('setup')
  }

  async function startSession() {
    setBusy(true)
    setError('')
    try {
      const result = await request<Session>('/sessions/start', {
        ageGroup, themeIds: selectedThemeIds, numberOfQuestions, saveSession, newQuestionsOnly: false,
      })
      setSessionId(result.sessionId)
      setTotalQuestions(result.totalQuestions)
      setQuestionNumber(1)
      setQuestion(result.firstQuestion)
      setSecondsLeft(result.firstQuestion.timeLimitSeconds)
      setSelectedOptionId(null)
      setFeedback(null)
      setSummary(null)
      answerLock.current = false
      setView('playing')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'La session n’a pas pu démarrer.')
    } finally { setBusy(false) }
  }

  async function submitAnswer(optionId: string | null) {
    if (!question || answerLock.current || feedback) return
    answerLock.current = true
    setBusy(true)
    try {
      const result = await request<Feedback>(`/sessions/${sessionId}/answers`, {
        questionId: question.id, selectedOptionId: optionId,
      })
      setFeedback(result)
    } catch (reason) {
      answerLock.current = false
      setError(reason instanceof Error ? reason.message : 'La réponse n’a pas pu être envoyée.')
    } finally { setBusy(false) }
  }
  async function continueQuiz() {
    if (!feedback) return
    if (!feedback.isSessionComplete) {
      if (!feedback.nextQuestion) return
      setQuestion(feedback.nextQuestion)
      setSecondsLeft(feedback.nextQuestion.timeLimitSeconds)
      setQuestionNumber(feedback.questionNumber + 1)
      setSelectedOptionId(null)
      setFeedback(null)
      answerLock.current = false
      return
    }

    setBusy(true)
    try {
      const result = await request<Summary>(`/sessions/${sessionId}/complete`, {})
      setSummary(result)
      if (saveSession) {
        const nextHistory = [{
          id: result.sessionId, date: new Date().toISOString(), scorePercentage: result.scorePercentage,
          correctAnswers: result.correctAnswers, totalQuestions: result.totalQuestions,
          themes: selectedThemes.map((theme) => theme.name), heroTrophyEarned: result.heroTrophyEarned,
        }, ...getHistory()].slice(0, 20)
        localStorage.setItem(historyKey, JSON.stringify(nextHistory))
        setHistory(nextHistory)
      }
      setView('results')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Les résultats n’ont pas pu être calculés.')
    } finally { setBusy(false) }
  }

  function setViewAndClear(nextView: View) {
    setError('')
    setView(nextView)
  }

  const brand = <a className="brand" href="#top" onClick={(event) => { event.preventDefault(); setViewAndClear('home') }}><span className="brand-mark"><BookOpen size={18} /></span><span>curio<span className="brand-dot">.</span></span></a>

  return <div className="app-shell" id="top">
    <header className="site-header"><div className="header-inner">
      {brand}
      {view === 'home' && <nav className="desktop-nav"><a href="#themes">Découvrir</a><a href="#how">Comment ça marche</a><button type="button" onClick={() => setView('history')}>Mon carnet</button></nav>}
      {view === 'playing' ? <button className="header-quiet" type="button" onClick={() => setViewAndClear('home')}><X size={16} /> Quitter</button> : view !== 'home' ? <button className="header-quiet" type="button" onClick={() => setViewAndClear('home')}><ArrowLeft size={16} /> Accueil</button> : <button className="header-cta" type="button" onClick={() => openSetup()}>Créer un quiz <ArrowRight size={15} /></button>}
    </div></header>

    {error && <div className="error-banner" role="alert"><CircleHelp size={17} /><span>{error}</span><button type="button" aria-label="Fermer" onClick={() => setError('')}><X size={16} /></button></div>}

    {view === 'home' && <main>
      <section className="hero-section">
        <div className="hero-copy"><span className="eyebrow"><Sparkles size={14} /> APPRENDRE EN JOUANT</span><h1>Une petite question.<br /><span>Une grande découverte.</span></h1><p>Des quiz de culture générale pensés pour chaque âge. Joue à ton rythme, découvre les réponses et garde les idées qui te suivent.</p><div className="hero-actions"><button className="primary-button" type="button" onClick={() => openSetup()}>Composer un quiz <ArrowRight size={17} /></button><a href="#how" className="text-link">Comment ça marche <ChevronRight size={15} /></a></div><div className="hero-proof"><span><Check size={14} /> Sans inscription</span><span><Check size={14} /> À ton rythme</span><span><Check size={14} /> Pour tous les âges</span></div></div>
        <div className="hero-art"><div className="art-shape" /><img src="/stitch-student.png" alt="Une jeune exploratrice souriante" /><span className="art-note art-note-top"><Sparkles size={14} /> À toi de jouer !</span><span className="art-note art-note-bottom"><i /> 7 thèmes à explorer</span><span className="art-spark">✦</span></div>
      </section>
      <section className="age-section"><div className="section-heading"><div><span className="section-kicker">FAIT POUR TOI</span><h2>À chaque âge, sa façon de découvrir</h2></div><span className="section-aside">Les questions s’adaptent à ton parcours.</span></div><div className="age-grid">{ageGroups.map((group, index) => { const Icon = group.icon; return <button type="button" key={group.id} className={`age-card ${group.tone}`} onClick={() => { setAgeGroup(group.id); openSetup(undefined, group.id) }}><span className="age-index">0{index + 1}</span><span className="age-icon"><Icon size={19} /></span><strong>{group.title}</strong><small>{group.range}</small><ArrowRight className="age-arrow" size={15} /></button> })}</div></section>
      <section className="theme-section" id="themes"><div className="section-heading"><div><span className="section-kicker">TES SUJETS, TON MÉLANGE</span><h2>Des thèmes qui ouvrent des portes</h2></div><button className="text-link" type="button" onClick={() => openSetup()}>Tous les thèmes <ChevronRight size={15} /></button></div><div className="theme-strip">{themes.map((theme) => { const Icon = themeIcons[theme.id] ?? BookOpen; return <button type="button" className="theme-tile" key={theme.id} onClick={() => openSetup(theme.id)}><span className="theme-icon" style={{ '--theme-accent': theme.accent } as CSSProperties}><Icon size={19} /></span><strong>{theme.name}</strong><small>{theme.questionCount} questions</small></button> })}</div></section>
      <section className="how-section" id="how"><div className="how-heading"><span className="section-kicker">SIMPLE COMME BONJOUR</span><h2>Comment ça marche ?</h2><p>Quelques choix, une question à la fois, et une nouvelle idée à emporter.</p></div><div className="steps-grid"><article><span className="step-icon step-blue"><Compass size={19} /></span><small>01</small><h3>Choisis ta route</h3><p>Définis ton âge, tes thèmes favoris et le nombre de questions.</p></article><article><span className="step-icon step-peach"><CircleHelp size={19} /></span><small>02</small><h3>Réfléchis à ton rythme</h3><p>Une minuterie souple t’accompagne sans te mettre la pression.</p></article><article><span className="step-icon step-green"><Lightbulb size={19} /></span><small>03</small><h3>Découvre pourquoi</h3><p>Chaque réponse est suivie d’une explication claire et utile.</p></article><article><span className="step-icon step-yellow"><Trophy size={19} /></span><small>04</small><h3>Célèbre tes progrès</h3><p>Atteins 70 % et décroche le trophée Héros.</p></article></div></section>
      <section className="closing-band"><span className="closing-icon"><BookOpen size={21} /></span><div><strong>Prêt·e à suivre ta curiosité ?</strong><p>Choisis quelques thèmes et lance ta première partie.</p></div><button className="primary-button" type="button" onClick={() => openSetup()}>Créer mon quiz <ArrowRight size={16} /></button></section>
      <footer className="site-footer"><strong>curio<span>.</span> <small>© 2026</small></strong><span>Des découvertes, une question à la fois.</span><a href="#top">Retour en haut ↑</a></footer>
    </main>}

    {view === 'setup' && <main className="flow-main setup-main">
      <div className="flow-topline"><span className="flow-label"><b>01</b> CONFIGURER LA PARTIE</span><span className="flow-note"><CircleHelp size={14} /> Une partie à la fois, sans pression.</span></div>
      <div className="flow-heading"><div><span className="section-kicker">À CHACUN SON RYTHME</span><h1>Prépare ton quiz</h1><p>Choisis ton âge, tes thèmes et le nombre de questions.</p></div><span className="flow-progress"><i /><i /><i /></span></div>
      <section className="setup-block"><div className="block-title"><b>1</b><div><h2>Ta tranche d’âge</h2><p>Pour trouver le bon niveau de questions.</p></div></div><div className="age-picker">{ageGroups.map((group) => <button type="button" key={group.id} className={`age-choice ${group.tone} ${ageGroup === group.id ? 'selected' : ''}`} aria-pressed={ageGroup === group.id} onClick={() => { setAgeGroup(group.id); setNumberOfQuestions(Math.min(numberOfQuestions, Math.max(1, selectedThemeIds.length * (group.id === '6-12' ? 2 : 1)))) }}><span className="choice-title">{group.title}</span><small>{group.range}</small>{ageGroup === group.id && <Check size={15} />}</button>)}</div></section>
      <section className="setup-block"><div className="block-title"><b>2</b><div><h2>Tes thèmes</h2><p>Choisis-en au moins un, tu peux les mélanger.</p></div><button type="button" className="select-all" onClick={() => { const all = selectedThemeIds.length !== themes.length; setSelectedThemeIds(all ? themes.map((theme) => theme.id) : []); if (all) setNumberOfQuestions(Math.min(5, themes.length * (ageGroup === '6-12' ? 2 : 1))) }}>Tout {selectedThemeIds.length === themes.length ? 'désélectionner' : 'sélectionner'}</button></div><div className="theme-picker">{themes.map((theme) => { const Icon = themeIcons[theme.id] ?? BookOpen; const chosen = selectedThemeIds.includes(theme.id); return <button type="button" key={theme.id} className={`theme-choice ${chosen ? 'selected' : ''}`} aria-pressed={chosen} onClick={() => { const next = chosen ? selectedThemeIds.filter((id) => id !== theme.id) : [...selectedThemeIds, theme.id]; setSelectedThemeIds(next); setNumberOfQuestions((count) => Math.max(1, Math.min(count, next.length * (ageGroup === '6-12' ? 2 : 1)))) }}><span className="theme-choice-icon" style={{ '--theme-accent': theme.accent } as CSSProperties}><Icon size={18} /></span><span><strong>{theme.name}</strong><small>{theme.description}</small></span><i>{chosen && <Check size={14} />}</i></button> })}</div></section>
      <section className="setup-block"><div className="block-title"><b>3</b><div><h2>Les détails de la partie</h2><p>Tu pourras modifier ces choix à la prochaine partie.</p></div></div><div className="option-row"><div><strong>Nombre de questions</strong><small>{availableCount} questions disponibles avec cette sélection</small></div><div className="stepper"><button type="button" aria-label="Retirer une question" disabled={numberOfQuestions <= 1} onClick={() => setNumberOfQuestions((count) => Math.max(1, count - 1))}><Minus size={15} /></button><output>{numberOfQuestions}</output><button type="button" aria-label="Ajouter une question" disabled={numberOfQuestions >= Math.min(20, availableCount)} onClick={() => setNumberOfQuestions((count) => Math.min(20, availableCount, count + 1))}><Plus size={15} /></button></div></div><div className="option-row"><div><strong>Garder cette partie dans mon carnet</strong><small>En mode invité, le résumé reste sur cet appareil.</small></div><button type="button" role="switch" aria-checked={saveSession} aria-label="Sauvegarder cette partie" className={`switch ${saveSession ? 'on' : ''}`} onClick={() => setSaveSession((value) => !value)}><i /></button></div><div className="option-row disabled-option"><div><strong>Nouvelles questions uniquement</strong><small>Un compte sera nécessaire pour utiliser ton historique.</small></div><button type="button" role="switch" aria-checked={false} aria-label="Nouvelles questions uniquement" className="switch" disabled><i /></button></div></section>
      <div className="setup-footer"><span><Clock3 size={15} /> Environ {Math.max(1, Math.round(numberOfQuestions * .7))} min</span><button className="primary-button" type="button" disabled={busy || !selectedThemeIds.length || numberOfQuestions > availableCount} onClick={() => void startSession()}>{busy ? 'Préparation…' : 'Lancer mon quiz'} <ArrowRight size={17} /></button></div>
    </main>}

    {view === 'playing' && question && <main className="flow-main game-main">
      <div className="game-topline"><button type="button" className="back-link" onClick={() => setViewAndClear('home')}><ArrowLeft size={15} /> Quitter la partie</button><span className="guest-label"><i /> MODE INVITÉ</span></div>
      <div className="game-progress-copy"><strong>QUESTION {String(questionNumber).padStart(2, '0')} <span>/ {String(totalQuestions).padStart(2, '0')}</span></strong><span>{question.themeName}</span></div><div className="game-progress"><i style={{ width: `${((questionNumber - 1) / totalQuestions) * 100}%` }} /></div>
      <section className="question-panel"><div className="question-meta"><span>{question.difficulty === 'moyenne' ? 'NIVEAU MOYEN' : 'NIVEAU FACILE'}</span><b className={secondsLeft !== null && secondsLeft <= 10 ? 'urgent' : ''}><Clock3 size={15} /> {secondsLeft ?? question.timeLimitSeconds}s</b></div><div className="question-copy"><span><Lightbulb size={20} /></span><h1>{question.prompt}</h1><p>Choisis la réponse qui te semble juste.</p></div><div className="answer-list" role="group" aria-label="Choisir une réponse">{question.options.map((option, index) => { const chosen = selectedOptionId === option.id; const correct = feedback?.correctAnswer === option.text; const wrong = Boolean(feedback && chosen && !feedback.isCorrect); return <button type="button" key={option.id} className={`answer-option ${chosen ? 'chosen' : ''} ${feedback && correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`} aria-pressed={chosen} disabled={Boolean(feedback) || busy} onClick={() => setSelectedOptionId(option.id)}><span>{String.fromCharCode(65 + index)}</span><strong>{option.text}</strong><i>{feedback && correct ? <Check size={17} /> : wrong ? <X size={17} /> : null}</i></button> })}</div>{feedback && <div className={`feedback ${feedback.isCorrect ? 'good' : 'try-again'}`} role="status"><b>{feedback.isCorrect ? 'Bonne réponse !' : secondsLeft === 0 ? 'Le temps est écoulé' : 'Pas tout à fait'}</b><p><strong>{feedback.correctAnswer}</strong> — {feedback.explanation}</p></div>}<div className="question-actions"><span>{feedback ? 'La réponse est enregistrée.' : 'Pas de pénalité pour une mauvaise réponse.'}</span><button className="primary-button" type="button" disabled={busy || (!feedback && !selectedOptionId)} onClick={() => feedback ? void continueQuiz() : void submitAnswer(selectedOptionId)}>{busy ? 'Vérification…' : feedback ? feedback.isSessionComplete ? 'Voir mon résultat' : 'Question suivante' : 'Valider ma réponse'} <ArrowRight size={16} /></button></div></section>
      <p className="game-footnote"><BookOpen size={15} /> Chaque question est une occasion d’apprendre quelque chose de nouveau.</p>
    </main>}

    {view === 'results' && summary && <main className="flow-main result-main"><span className="results-kicker"><Sparkles size={14} /> PARTIE TERMINÉE</span><section className="results-heading"><span className="result-medal">{summary.heroTrophyEarned ? <Trophy size={28} /> : <Sparkles size={28} />}</span><h1>{summary.heroTrophyEarned ? 'Tu es un Héros !' : 'Bien joué, explorateur·rice !'}</h1><p>{summary.heroTrophyEarned ? 'Ta curiosité t’a mené loin. Continue à découvrir !' : 'Chaque bonne réponse est un pas de plus. Prêt·e à retenter ?'}</p>{summary.heroTrophyEarned && <span className="trophy-tag"><Trophy size={14} /> TROPHÉE HÉROS</span>}</section><section className="score-panel"><div className="score-main"><small>TON SCORE</small><strong>{summary.scorePercentage}<i>%</i></strong><span>{summary.performanceLevel}</span></div><div className="score-stat"><Check size={17} /><strong>{summary.correctAnswers}/{summary.totalQuestions}</strong><small>bonnes réponses</small></div><div className="score-stat"><Clock3 size={17} /><strong>{summary.averageSecondsPerQuestion} sec</strong><small>par question</small></div><div className="score-stat"><Compass size={17} /><strong>{selectedThemes.length}</strong><small>thèmes explorés</small></div></section><div className="result-note"><Lightbulb size={18} /><p>{summary.scorePercentage >= 70 ? 'La curiosité ne s’arrête pas au score. Chaque explication est une graine pour la suite.' : 'Se tromper fait partie du chemin. Les explications aident tes connaissances à grandir.'}</p></div>{saveSession && <p className="saved-note"><Check size={14} /> Résumé ajouté à ton carnet sur cet appareil.</p>}<div className="result-actions"><button className="primary-button" type="button" onClick={() => openSetup()}>Rejouer une partie <RotateCcw size={16} /></button><button className="secondary-button" type="button" onClick={() => setView('history')}>Voir mon carnet <BookOpen size={16} /></button><button className="text-link" type="button" onClick={() => setView('home')}>Accueil <ArrowRight size={15} /></button></div></main>}

    {view === 'history' && <main className="flow-main history-main"><div className="flow-topline"><span className="flow-label"><b><BookOpen size={13} /></b> MON CARNET</span><span className="flow-note">Conservé sur cet appareil</span></div><div className="history-heading"><span className="section-kicker">TES TRACES DE CURIOSITÉ</span><h1>Ton carnet de découvertes</h1><p>Les parties que tu as choisi de garder, juste ici.</p></div>{history.length === 0 ? <section className="empty-history"><BookOpen size={28} /><h2>Ton carnet est encore vierge</h2><p>Active l’option de sauvegarde lors de ta prochaine partie pour garder ton résultat ici.</p><button className="primary-button" type="button" onClick={() => openSetup()}>Lancer une partie <ArrowRight size={16} /></button></section> : <div className="history-list">{history.map((entry) => <article key={entry.id} className="history-entry"><time>{new Date(entry.date).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' })}</time><div><strong>{entry.correctAnswers}/{entry.totalQuestions} bonnes réponses · {entry.scorePercentage}%</strong><small>{entry.themes.join(', ')}</small></div><span className={entry.heroTrophyEarned ? 'history-trophy earned' : 'history-trophy'}>{entry.heroTrophyEarned ? <><Trophy size={14} /> Héros</> : 'Terminé'}</span></article>)}</div>}<button type="button" className="back-link" onClick={() => setView('home')}><ArrowLeft size={15} /> Retour à l’accueil</button></main>}
  </div>
}

export default App

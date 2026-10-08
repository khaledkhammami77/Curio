using System.Collections.Concurrent;
using System.Security.Cryptography;

public sealed class QuizSessionStore
{
    private static readonly string[] AgeGroups = ["<6", "6-12", "13-16", ">16"];

    private static readonly Theme[] Themes =
    [
        new("canada-history", "Histoire du Canada", "Des premiers peuples à aujourd'hui", "#D96942"),
        new("canada-geography", "Géographie du Canada", "Explore le pays d'un océan à l'autre", "#268A78"),
        new("world-geography", "Géographie du monde", "Repères, pays et merveilles", "#3972B8"),
        new("science", "Sciences", "Le monde vivant et ses phénomènes", "#7456A8"),
        new("math", "Mathématiques", "Raisonnement et nombres", "#C58B31"),
        new("astronomy", "Astronomie", "À la découverte du cosmos", "#386A9B"),
        new("religion", "Religions et cultures", "Traditions et fêtes avec neutralité", "#B45673")
    ];

    private static readonly Question[] Questions =
    [
        Q("history-u6", "canada-history", "<6", "Le Canada est-il un pays?", ["Oui", "Non"], "Oui", "Le Canada est un pays situé en Amérique du Nord.", "facile"),
        Q("history-01", "canada-history", "6-12", "Quel est le nom du peuple autochtone dont le nom signifie souvent « le peuple » en langue algonquine?", ["Inuit", "Anishinaabe", "Mi'kmaq", "Haïda"], "Anishinaabe", "Le terme Anishinaabe est utilisé par plusieurs peuples des régions des Grands Lacs.", "facile"),
        Q("history-02", "canada-history", "6-12", "En quelle année la Confédération canadienne a-t-elle été créée?", ["1492", "1776", "1867", "1914"], "1867", "Le Dominion du Canada a été créé le 1er juillet 1867.", "moyenne"),
        Q("history-03", "canada-history", "13-16", "Quel document constitutionnel a rapatrié la Constitution canadienne en 1982?", ["L'Acte de Québec", "La Loi constitutionnelle de 1982", "Le Statut de Westminster", "La Proclamation royale"], "La Loi constitutionnelle de 1982", "Le rapatriement a notamment inclus la Charte canadienne des droits et libertés.", "moyenne"),
        Q("history-04", "canada-history", ">16", "Quel traité a établi des relations entre la Couronne britannique et plusieurs Premières Nations après la guerre de Sept Ans?", ["Traité de Paris", "Proclamation royale de 1763", "Traité de Gand", "Acte d'Union"], "Proclamation royale de 1763", "La Proclamation royale a reconnu des territoires autochtones et encadré l'acquisition de terres.", "moyenne"),
        Q("canadageo-u6", "canada-geography", "<6", "Y a-t-il des montagnes au Canada?", ["Oui", "Non"], "Oui", "Les Rocheuses et d'autres chaînes de montagnes font partie des paysages du Canada.", "facile"),
        Q("canadageo-01", "canada-geography", "6-12", "Quelle est la capitale du Canada?", ["Toronto", "Ottawa", "Montréal", "Vancouver"], "Ottawa", "Ottawa se trouve en Ontario, près de la frontière du Québec.", "facile"),
        Q("canadageo-02", "canada-geography", "6-12", "Quel océan borde le Canada à l'ouest?", ["Atlantique", "Arctique", "Pacifique", "Indien"], "Pacifique", "La côte de la Colombie-Britannique longe l'océan Pacifique.", "facile"),
        Q("canadageo-03", "canada-geography", "13-16", "Quelle province canadienne compte le plus d'habitants?", ["Québec", "Ontario", "Alberta", "Colombie-Britannique"], "Ontario", "L'Ontario est la province la plus peuplée du Canada.", "facile"),
        Q("canadageo-04", "canada-geography", ">16", "Quel territoire canadien a pour capitale Iqaluit?", ["Yukon", "Territoires du Nord-Ouest", "Nunavut", "Labrador"], "Nunavut", "Iqaluit, sur l'île de Baffin, est la capitale du Nunavut.", "facile"),
        Q("worldgeo-u6", "world-geography", "<6", "Un globe montre-t-il la planète Terre?", ["Oui", "Non"], "Oui", "Un globe est une représentation en forme de boule de la Terre.", "facile"),
        Q("worldgeo-01", "world-geography", "6-12", "Quel est le plus grand océan du monde?", ["Atlantique", "Indien", "Arctique", "Pacifique"], "Pacifique", "L'océan Pacifique couvre plus de surface que tout autre océan.", "facile"),
        Q("worldgeo-02", "world-geography", "6-12", "Sur quel continent se trouve le désert du Sahara?", ["Asie", "Afrique", "Amérique du Sud", "Europe"], "Afrique", "Le Sahara s'étend dans le nord de l'Afrique.", "facile"),
        Q("worldgeo-03", "world-geography", "13-16", "Quel fleuve traverse la ville de Budapest?", ["Rhin", "Danube", "Seine", "Tamise"], "Danube", "Le Danube traverse Budapest et sépare historiquement Buda et Pest.", "facile"),
        Q("worldgeo-04", "world-geography", ">16", "Quel pays possède le plus grand nombre de fuseaux horaires en comptant ses territoires d'outre-mer?", ["Russie", "États-Unis", "France", "Chine"], "France", "Les territoires français répartis dans le monde couvrent douze fuseaux horaires.", "moyenne"),
        Q("science-u6", "science", "<6", "Combien de pattes un chien a-t-il le plus souvent?", ["Deux", "Quatre"], "Quatre", "La plupart des chiens ont quatre pattes.", "facile"),
        Q("science-01", "science", "6-12", "Quelle planète est surnommée la planète rouge?", ["Vénus", "Mars", "Jupiter", "Mercure"], "Mars", "La poussière riche en oxyde de fer donne à Mars sa couleur rougeâtre.", "facile"),
        Q("science-02", "science", "6-12", "Quel organe pompe le sang dans le corps humain?", ["Les poumons", "Le cerveau", "Le cœur", "L'estomac"], "Le cœur", "Le cœur propulse le sang dans le système circulatoire.", "facile"),
        Q("science-03", "science", "13-16", "Quel gaz les plantes absorbent-elles principalement pour la photosynthèse?", ["Oxygène", "Dioxyde de carbone", "Azote", "Hydrogène"], "Dioxyde de carbone", "Les plantes utilisent le dioxyde de carbone, l'eau et l'énergie lumineuse pour produire des sucres.", "moyenne"),
        Q("science-04", "science", ">16", "Quelle particule porte une charge électrique négative?", ["Proton", "Neutron", "Électron", "Photon"], "Électron", "Les électrons portent une charge négative et se trouvent autour du noyau atomique.", "moyenne"),
        Q("math-u6", "math", "<6", "Combien font 1 + 1?", ["1", "2"], "2", "Si on ajoute un objet à un autre, on en a deux.", "facile"),
        Q("math-01", "math", "6-12", "Combien font 7 × 8?", ["48", "54", "56", "64"], "56", "Huit groupes de sept donnent cinquante-six.", "facile"),
        Q("math-02", "math", "6-12", "Quel est le quart de 100?", ["20", "25", "40", "50"], "25", "Un quart correspond à diviser par quatre : 100 ÷ 4 = 25.", "facile"),
        Q("math-03", "math", "13-16", "Quelle est la valeur de x dans 3x + 5 = 20?", ["3", "5", "8", "15"], "5", "Soustrais 5 des deux côtés puis divise 15 par 3.", "moyenne"),
        Q("math-04", "math", ">16", "Quelle est la somme des angles intérieurs d'un hexagone?", ["540°", "600°", "720°", "900°"], "720°", "Un polygone à six côtés a une somme d'angles de (6 − 2) × 180°.", "moyenne"),
        Q("astro-u6", "astronomy", "<6", "Le Soleil aide-t-il à éclairer la Terre?", ["Oui", "Non"], "Oui", "La lumière du Soleil éclaire la Terre pendant la journée.", "facile"),
        Q("astro-01", "astronomy", "6-12", "Quelle étoile est la plus proche de la Terre?", ["Sirius", "Proxima du Centaure", "Le Soleil", "Véga"], "Le Soleil", "Le Soleil est l'étoile autour de laquelle la Terre orbite.", "facile"),
        Q("astro-02", "astronomy", "6-12", "Comment appelle-t-on le trajet d'une planète autour d'une étoile?", ["Une rotation", "Une orbite", "Une éclipse", "Une galaxie"], "Une orbite", "Une planète suit une orbite autour de son étoile.", "facile"),
        Q("astro-03", "astronomy", "13-16", "Quelle planète du système solaire possède les anneaux les plus visibles?", ["Mars", "Saturne", "Mercure", "Vénus"], "Saturne", "Les anneaux de Saturne sont larges et brillants, même si d'autres planètes en possèdent aussi.", "facile"),
        Q("astro-04", "astronomy", ">16", "Quel phénomène explique le décalage vers le rouge observé dans la lumière de galaxies lointaines?", ["La contraction de l'Univers", "L'expansion de l'Univers", "La rotation de la Terre", "La réfraction atmosphérique"], "L'expansion de l'Univers", "L'expansion étire la longueur d'onde de la lumière pendant son voyage.", "moyenne"),
        Q("religion-u6", "religion", "<6", "La synagogue est un lieu de prière pour quelle tradition?", ["Le judaïsme", "Le bouddhisme"], "Le judaïsme", "La synagogue est un lieu de rassemblement et de prière dans le judaïsme.", "facile"),
        Q("religion-01", "religion", "6-12", "Quelle fête juive rappelle la libération des Hébreux de l'esclavage en Égypte?", ["Hanoucca", "Pessa'h", "Pourim", "Souccot"], "Pessa'h", "Pessa'h, aussi appelée Pâque juive, commémore cet épisode de la tradition juive.", "facile"),
        Q("religion-02", "religion", "6-12", "Dans quelle tradition le mois de jeûne du Ramadan est-il observé?", ["Bouddhisme", "Islam", "Hindouisme", "Sikhisme"], "Islam", "Le Ramadan est un mois important du calendrier islamique; les pratiques varient selon les personnes et les situations.", "facile"),
        Q("religion-03", "religion", "13-16", "Diwali est une fête importante célébrée principalement dans quelles traditions?", ["Hindouisme, jaïnisme et sikhisme", "Judaïsme uniquement", "Shinto uniquement", "Christianisme uniquement"], "Hindouisme, jaïnisme et sikhisme", "Diwali est célébrée dans plusieurs communautés avec des significations et pratiques diverses.", "moyenne"),
        Q("religion-04", "religion", ">16", "Quel principe est commun à de nombreuses traditions religieuses et philosophiques, sous des formulations variées?", ["La réciprocité morale", "Une seule langue sacrée universelle", "Un calendrier identique", "Une même organisation"], "La réciprocité morale", "Des idées de réciprocité et de compassion apparaissent dans des traditions distinctes, sans être identiques.", "moyenne")
    ];

    private readonly ConcurrentDictionary<string, QuizSession> _sessions = new();

    public IReadOnlyList<QuizThemeResponse> GetThemes() => Themes
        .Select(theme => new QuizThemeResponse(
            theme.Id,
            theme.Name,
            theme.Description,
            Questions.Count(question => question.ThemeId == theme.Id),
            theme.Accent))
        .ToArray();

    public bool SessionExists(string sessionId) => _sessions.ContainsKey(sessionId);

    public StartSessionResponse? Start(StartSessionRequest request)
    {
        if (!AgeGroups.Contains(request.AgeGroup) || request.NewQuestionsOnly ||
            request.ThemeIds.Any(themeId => Themes.All(theme => theme.Id != themeId)))
        {
            return null;
        }

        var candidates = Questions
            .Where(question => question.AgeGroup == request.AgeGroup && request.ThemeIds.Contains(question.ThemeId))
            .ToArray();

        if (candidates.Length < request.NumberOfQuestions)
        {
            return null;
        }

        Shuffle(candidates);
        var selected = candidates.Take(request.NumberOfQuestions).ToArray();
        var session = new QuizSession(selected, request.AgeGroup, request.SaveSession);
        _sessions[session.Id] = session;

        return new StartSessionResponse(session.Id, selected.Length, ToResponse(selected[0], request.AgeGroup));
    }

    public AnswerFeedbackResponse? SubmitAnswer(string sessionId, SubmitAnswerRequest request)
    {
        if (!_sessions.TryGetValue(sessionId, out var session))
        {
            return null;
        }

        lock (session.SyncRoot)
        {
            if (session.IsCompleted || session.CurrentIndex >= session.Questions.Length ||
                session.Questions[session.CurrentIndex].Id != request.QuestionId)
            {
                return null;
            }

            var question = session.Questions[session.CurrentIndex];
            var elapsed = Math.Max(0, (int)Math.Ceiling((DateTimeOffset.UtcNow - session.QuestionStartedAt).TotalSeconds));
            var timeLimitSeconds = GetTimeLimitSeconds(question, session.AgeGroup);
            var expired = elapsed > timeLimitSeconds;
            var isCorrect = !expired && request.SelectedOptionId == question.CorrectOptionId;
            session.Answers.Add(new SessionAnswer(isCorrect, Math.Min(elapsed, timeLimitSeconds)));
            session.CurrentIndex++;

            var isComplete = session.CurrentIndex == session.Questions.Length;
            var nextQuestion = isComplete
                ? null
                : ToResponse(session.Questions[session.CurrentIndex], session.AgeGroup);
            session.QuestionStartedAt = DateTimeOffset.UtcNow;

            return new AnswerFeedbackResponse(
                question.Id,
                isCorrect,
                question.Options.Single(option => option.Id == question.CorrectOptionId).Text,
                question.Explanation,
                session.CurrentIndex,
                session.Questions.Length,
                isComplete,
                nextQuestion);
        }
    }

    public SessionSummaryResponse? Complete(string sessionId)
    {
        if (!_sessions.TryGetValue(sessionId, out var session))
        {
            return null;
        }

        lock (session.SyncRoot)
        {
            if (session.CurrentIndex != session.Questions.Length)
            {
                return null;
            }

            session.IsCompleted = true;
            var correctAnswers = session.Answers.Count(answer => answer.IsCorrect);
            var percentage = (int)Math.Round(correctAnswers * 100d / session.Questions.Length);
            var performance = percentage >= 85 ? "Expert" : percentage >= 70 ? "Très bien" : percentage >= 45 ? "En progression" : "Explorateur";

            return new SessionSummaryResponse(
                session.Id,
                session.Questions.Length,
                correctAnswers,
                percentage,
                (int)Math.Round(session.Answers.Average(answer => answer.Seconds)),
                performance,
                percentage >= 70);
        }
    }

    private static QuizQuestionResponse ToResponse(Question question, string ageGroup)
    {
        var theme = Themes.Single(item => item.Id == question.ThemeId);
        return new QuizQuestionResponse(
            question.Id,
            question.ThemeId,
            theme.Name,
            ageGroup,
            question.Difficulty,
            question.Type,
            question.Prompt,
            question.Options,
                GetTimeLimitSeconds(question, ageGroup));
    }

            private static int GetTimeLimitSeconds(Question question, string ageGroup)
            {
            var timeLimit = question.Type == "vrai-faux" ? 15 : 30;
            timeLimit += question.Difficulty == "moyenne" ? 10 : 0;
            timeLimit += ageGroup == "<6" ? 20 : ageGroup == "6-12" ? 10 : 0;
            return Math.Min(timeLimit, 120);
            }

    private static Question Q(
        string id,
        string themeId,
        string ageGroup,
        string prompt,
        string[] options,
        string correctText,
        string explanation,
        string difficulty)
    {
        var mappedOptions = options.Select((text, index) => new QuizOptionResponse($"{id}-option-{index + 1}", text)).ToArray();
        var correctOptionId = mappedOptions.Single(option => option.Text == correctText).Id;
        return new Question(id, themeId, ageGroup, difficulty, "qcm", prompt, mappedOptions, correctOptionId, explanation);
    }

    private static void Shuffle<T>(T[] items)
    {
        for (var index = items.Length - 1; index > 0; index--)
        {
            var swapIndex = RandomNumberGenerator.GetInt32(index + 1);
            (items[index], items[swapIndex]) = (items[swapIndex], items[index]);
        }
    }

    private sealed record Theme(string Id, string Name, string Description, string Accent);
    private sealed record Question(
        string Id,
        string ThemeId,
        string AgeGroup,
        string Difficulty,
        string Type,
        string Prompt,
        IReadOnlyList<QuizOptionResponse> Options,
        string CorrectOptionId,
        string Explanation);
    private sealed record SessionAnswer(bool IsCorrect, int Seconds);

    private sealed class QuizSession(Question[] questions, string ageGroup, bool saveSession)
    {
        public string Id { get; } = Guid.NewGuid().ToString("N");
        public Question[] Questions { get; } = questions;
        public string AgeGroup { get; } = ageGroup;
        public bool SaveSession { get; } = saveSession;
        public object SyncRoot { get; } = new();
        public List<SessionAnswer> Answers { get; } = [];
        public int CurrentIndex { get; set; }
        public bool IsCompleted { get; set; }
        public DateTimeOffset QuestionStartedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
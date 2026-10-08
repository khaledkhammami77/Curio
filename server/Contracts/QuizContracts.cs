using System.ComponentModel.DataAnnotations;

public sealed record QuizThemeResponse(
    string Id,
    string Name,
    string Description,
    int QuestionCount,
    string Accent);

public sealed record QuizOptionResponse(string Id, string Text);

public sealed record QuizQuestionResponse(
    string Id,
    string ThemeId,
    string ThemeName,
    string AgeGroup,
    string Difficulty,
    string Type,
    string Prompt,
    IReadOnlyList<QuizOptionResponse> Options,
    int TimeLimitSeconds);

public sealed record StartSessionResponse(
    string SessionId,
    int TotalQuestions,
    QuizQuestionResponse FirstQuestion);

public sealed record AnswerFeedbackResponse(
    string QuestionId,
    bool IsCorrect,
    string CorrectAnswer,
    string Explanation,
    int QuestionNumber,
    int TotalQuestions,
    bool IsSessionComplete,
    QuizQuestionResponse? NextQuestion);

public sealed record SessionSummaryResponse(
    string SessionId,
    int TotalQuestions,
    int CorrectAnswers,
    int ScorePercentage,
    int AverageSecondsPerQuestion,
    string PerformanceLevel,
    bool HeroTrophyEarned);

public sealed record StartSessionRequest
{
    [Required]
    public required string AgeGroup { get; init; }

    [Required, MinLength(1)]
    public required string[] ThemeIds { get; init; }

    [Range(1, 20)]
    public int NumberOfQuestions { get; init; } = 5;

    public bool SaveSession { get; init; }

    public bool NewQuestionsOnly { get; init; }
}

public sealed record SubmitAnswerRequest
{
    [Required]
    public required string QuestionId { get; init; }

    public string? SelectedOptionId { get; init; }
}
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

public static class QuizEndpoints
{
    public static IEndpointRouteBuilder MapQuizEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api");

        group.MapGet("/themes", (QuizSessionStore store) => TypedResults.Ok(store.GetThemes()))
            .WithName("GetQuizThemes");

        group.MapPost("/sessions/start", Results<Ok<StartSessionResponse>, BadRequest<ProblemDetails>> (
            StartSessionRequest request,
            QuizSessionStore store) =>
        {
            var session = store.Start(request);
            return session is null
                ? TypedResults.BadRequest(new ProblemDetails
                {
                    Title = "Session impossible à démarrer",
                    Detail = request.NewQuestionsOnly
                        ? "L'historique des questions inédites nécessite un compte utilisateur."
                        : "Choisis des thèmes contenant assez de questions pour cette tranche d'âge."
                })
                : TypedResults.Ok(session);
        }).WithName("StartQuizSession");

        group.MapPost("/sessions/{sessionId}/answers", Results<Ok<AnswerFeedbackResponse>, NotFound> (
            string sessionId,
            SubmitAnswerRequest request,
            QuizSessionStore store) =>
        {
            var feedback = store.SubmitAnswer(sessionId, request);
            return feedback is null ? TypedResults.NotFound() : TypedResults.Ok(feedback);
        }).WithName("SubmitQuizAnswer");

        group.MapPost("/sessions/{sessionId}/complete", Results<Ok<SessionSummaryResponse>, NotFound, BadRequest<ProblemDetails>> (
            string sessionId,
            QuizSessionStore store) =>
        {
            var summary = store.Complete(sessionId);
            if (summary is not null)
            {
                return TypedResults.Ok(summary);
            }

            return store.SessionExists(sessionId)
                ? TypedResults.BadRequest(new ProblemDetails
                {
                    Title = "Session incomplète",
                    Detail = "Réponds à toutes les questions avant de terminer la session."
                })
                : TypedResults.NotFound();
        }).WithName("CompleteQuizSession");

        return endpoints;
    }
}
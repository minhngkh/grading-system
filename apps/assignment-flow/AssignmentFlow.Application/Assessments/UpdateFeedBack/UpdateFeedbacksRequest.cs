namespace AssignmentFlow.Application.Assessments.UpdateFeedBack;

public class UpdateFeedbacksRequest
{
    public List<FeedbackItemApiContract> Feedbacks { get; set; } = []; // All feedback
}

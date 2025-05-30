﻿using EventFlow.Commands;

namespace AssignmentFlow.Application.Assessments.UpdateFeedBack;

public class Command(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
    public List<Feedback> Feedbacks { get; init; } = [];
}
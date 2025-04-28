using Grpc.Core;
using RubricEngine.Application.Models;
using RubricEngine.Application.Protos;

namespace RubricEngine.Application.Rubrics.Grpc;

public class RubricService
    (RubricDbContext dbContext, ILogger<RubricService> logger)
    : RubricProtoService.RubricProtoServiceBase
{
    public override Task<GetRubricResponse> GetRubric(GetRubricRequest request, ServerCallContext context)
    {
        var rubric = dbContext.Rubrics
            .FirstOrDefault(r => r.Id == request.RubricId);

        if (rubric == null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, "Rubric not found"));
        }

        var response = new GetRubricResponse
        {
            Rubric = new Protos.Rubric
            {
                Id = rubric.Id,
                Name = rubric.RubricName,
                Criteria = { rubric.Criteria.Select(c => new Protos.Criterion
                {
                    Name = c.Name,
                    Weight = decimal.ToDouble(c.Weight),
                    Levels = { c.Levels.Select(l => new Protos.PerformanceLevel
                    {
                        Tag = l.PerformanceTag,
                        Description = l.Description,
                        Weight = decimal.ToDouble(l.Weight)
                    }) }
                }) }
            }
        };

        return Task.FromResult(response);
    }
}

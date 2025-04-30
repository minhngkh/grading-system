using Grpc.Core;
using Microsoft.EntityFrameworkCore;
using RubricEngine.Application.Models;
using RubricEngine.Application.Protos;

namespace RubricEngine.Application.Rubrics.Grpc;

public class RubricService(RubricDbContext dbContext) : RubricProtoService.RubricProtoServiceBase
{
    public override async Task<RubricModel> GetRubric(GetRubricRequest request, ServerCallContext context)
    {
        var rubric = await dbContext.Rubrics
            .FirstOrDefaultAsync(r => r.Id == request.RubricId) 
            ?? throw new RpcException(new Status(StatusCode.NotFound, "Rubric not found"));

        var rubricModel = new RubricModel
        {
            Id = rubric.Id,
            Name = rubric.RubricName,
            Criteria = { rubric.Criteria.Select(c => new CriterionModel
                {
                    Name = c.Name,
                    Weight = decimal.ToDouble(c.Weight),
                    Levels = { c.Levels.Select(l => new PerformanceLevelModel
                    {
                        Tag = l.PerformanceTag,
                        Description = l.Description,
                        Weight = decimal.ToDouble(l.Weight)
                    }) }
                }) }
        };

        return rubricModel;
    }
}

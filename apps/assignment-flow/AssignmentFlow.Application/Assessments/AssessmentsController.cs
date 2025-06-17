using JsonApiDotNetCore.Configuration;
using JsonApiDotNetCore.Controllers;
using JsonApiDotNetCore.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Assessments;

[Authorize]
[Route("api/v1/[controller]")]
public class AssessmentsController : BaseJsonApiController<Assessment, string>
{
    public AssessmentsController(
        IJsonApiOptions options,
        IResourceGraph resourceGraph,
        ILoggerFactory loggerFactory,
        IResourceService<Assessment, string> resourceService) : base(options, resourceGraph, loggerFactory, resourceService)
    {
    }

    [HttpGet(Name = "GetAssessments")]
    public async Task<IActionResult> GetAssessments(CancellationToken cancellationToken = default)
    {
        return await base.GetAsync(cancellationToken);
    }

    [HttpGet("{id}", Name = "GetAssessmentById")]
    public async Task<IActionResult> GetAssessmentById(string id, CancellationToken cancellationToken = default)
    {
        return await base.GetAsync(id, cancellationToken);
    }
}

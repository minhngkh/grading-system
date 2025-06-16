using JsonApiDotNetCore.Configuration;
using JsonApiDotNetCore.Controllers;
using JsonApiDotNetCore.Services;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings;

[Route("api/v1/[controller]")]
public class GradingsController : BaseJsonApiController<Grading, string>
{
    public GradingsController(
        IJsonApiOptions options,
        IResourceGraph resourceGraph,
        ILoggerFactory loggerFactory,
        IResourceService<Grading, string> resourceService) : base(options, resourceGraph, loggerFactory, resourceService)
    {
    }

    [HttpGet(Name = "GetGradings")]
    public async Task<IActionResult> GetGradings(CancellationToken cancellationToken = default)
    {
        return await base.GetAsync(cancellationToken);
    }

    [HttpGet("{id}", Name = "GetGradingById")]
    public async Task<IActionResult> GetGradingById(string id, CancellationToken cancellationToken = default)
    {
        return await base.GetAsync(id, cancellationToken);
    }
}

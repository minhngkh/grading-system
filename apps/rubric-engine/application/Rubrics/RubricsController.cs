using JsonApiDotNetCore.Configuration;
using JsonApiDotNetCore.Controllers;
using JsonApiDotNetCore.Services;
using Microsoft.AspNetCore.Mvc;

namespace RubricEngine.Application.Rubrics;

[Route("api/v1/[controller]")]
public class RubricsController : BaseJsonApiController<Rubric, string>
{
    public RubricsController(
        IJsonApiOptions options,
        IResourceGraph resourceGraph,
        ILoggerFactory loggerFactory,
        IResourceService<Rubric, string> resourceService) : base(options, resourceGraph, loggerFactory, resourceService)
    {
    }

    [HttpGet(Name = "GetRubrics")]
    public async Task<IActionResult> GetRubrics(CancellationToken cancellationToken = default)
    {
        return await base.GetAsync(cancellationToken);
    }

    [HttpGet("{id}", Name = "GetRubricById")]
    public async Task<IActionResult> GetRubricById(string id, CancellationToken cancellationToken = default)
    {
        return await base.GetAsync(id, cancellationToken);
    }
}

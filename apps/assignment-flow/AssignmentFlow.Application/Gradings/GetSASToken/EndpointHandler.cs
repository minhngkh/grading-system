using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.GetSASToken;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapGetSASToken(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapGet("/sasToken", GetSASToken)
            .WithName("GetSASToken")
            .Produces<string>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    [Authorize]
    private static IResult GetSASToken(
        [FromServices] BlobServiceClient blobServiceClient,
        [FromServices] IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        // Here you would implement the logic to get the Azure Storage SAS token
        var containerName = "submissions-store";
        var containerClient = blobServiceClient.GetBlobContainerClient(containerName);

        // set properties on BlobSasBuilder class
        var sasBuilder = new BlobSasBuilder()
        {
            BlobContainerName = containerName,
            StartsOn = DateTimeOffset.UtcNow,
            ExpiresOn = DateTimeOffset.UtcNow.AddSeconds(60), // Expiration time for the SAS token
        };

        // set the required permissions on the SAS token
        sasBuilder.SetPermissions(BlobSasPermissions.Read | BlobSasPermissions.Write | BlobSasPermissions.List);

        sasBuilder.Resource = "c";
        var sasToken = containerClient.GenerateSasUri(sasBuilder).Query;

        return TypedResults.Ok(sasToken);
    }
}

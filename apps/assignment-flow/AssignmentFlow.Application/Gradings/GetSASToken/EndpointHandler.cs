using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.GetSASToken;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapGetSASToken(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapGet("/{grading:required}/sasToken", GetSASToken)
            .WithName("GetSASToken")
            .Produces<string>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    //[Authorize]
    private static async Task<IResult> GetSASToken(
        [FromRoute] string grading,
        [FromQuery] string attachment,
        [FromServices] BlobServiceClient blobServiceClient,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(attachment))
            return TypedResults.BadRequest("Attachment is required.");

        // Here you would implement the logic to get the Azure Storage SAS token
        var containerName = "submissions-store";
        var blobName = $"{grading}/{attachment}";
        var containerClient = blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(blobName);

        // set properties on BlobSasBuilder class
        var sasBuilder = new BlobSasBuilder()
        {
            BlobContainerName = containerName,
            BlobName = blobName,
            StartsOn = DateTimeOffset.UtcNow,
            ExpiresOn = DateTimeOffset.UtcNow.AddSeconds(60), // Expiration time for the SAS token
        };

        // set the required permissions on the SAS token
        sasBuilder.SetPermissions(BlobSasPermissions.Read | BlobSasPermissions.Write);

        //Create token at the blob level
        sasBuilder.Resource = "b";
        sasBuilder.BlobName = blobName;
        var sasToken = blobClient.GenerateSasUri(sasBuilder);

        return TypedResults.Ok(sasToken);
    }
}

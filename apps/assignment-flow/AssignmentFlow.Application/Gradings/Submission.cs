using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AssignmentFlow.Application.Gradings;

[JsonConverter(typeof(SubmissionConverter))]
public sealed class Submission : ValueObject
{
    public SubmissionReference Reference { get; }
    public HashSet<CriterionFiles> CriteriaFiles { get; }

    private Submission(SubmissionReference reference, HashSet<CriterionFiles> criterionFiles)
    {
        Reference = reference;
        CriteriaFiles = criterionFiles;
    }

    public static Submission New(SubmissionReference reference, HashSet<CriterionFiles> criterionFiles)
        => new (reference, criterionFiles);

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Reference;
        foreach (var criterionFiles in CriteriaFiles)
        {
            yield return criterionFiles;
        }
    }
}

[JsonConverter(typeof(CriterionFilesConverter))]
public sealed class CriterionFiles : ValueObject
{
    public CriterionName Criterion { get; }
    public List<Attachment> Files { get; }
    
    private CriterionFiles(CriterionName criterion, List<Attachment> files)
    {
        Criterion = criterion;
        Files = files;
    }
    
    public static CriterionFiles New(CriterionName criterion, List<Attachment> files) 
        => new (criterion, files);
    
    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Criterion;
        foreach (var file in Files)
        {
            yield return file;       
        }
    }
}

public sealed class SubmissionConverter : JsonConverter<Submission>
{
    public override Submission? ReadJson(JsonReader reader, Type objectType, Submission? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        
        var jObject = JObject.Load(reader);
        var reference = jObject.GetRequired<SubmissionReference>("Reference");
        var criteriaFiles = jObject.GetRequired<HashSet<CriterionFiles>>("CriteriaFiles");

        return Submission.New(reference, criteriaFiles);
    }

    public override bool CanWrite => false;

    public override void WriteJson(JsonWriter writer, Submission? value, JsonSerializer serializer) => throw new NotSupportedException();
}

public sealed class CriterionFilesConverter : JsonConverter<CriterionFiles>
{

    public override CriterionFiles? ReadJson(JsonReader reader, Type objectType, CriterionFiles? existingValue,
        bool hasExistingValue,
        JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        
        var jObject = JObject.Load(reader);
        var criterion = jObject.GetRequired<CriterionName>("Criterion");
        var files = jObject.GetRequired<List<Attachment>>("Files");
        return CriterionFiles.New(criterion, files);
    }
    
    public override bool CanWrite => false;
    
    public override void WriteJson(JsonWriter writer, CriterionFiles? value, JsonSerializer serializer)
        => throw new NotSupportedException();
}

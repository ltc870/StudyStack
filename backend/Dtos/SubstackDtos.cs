using backend.Entities;

namespace backend.Dtos;

public class SubstackCreateDto
{
    public int StackId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class SubstackUpdateDto
{
    public string Name { get; set; } = string.Empty;
}

public class SubstackResponseDto
{
    public int Id { get; set; }
    public int StackId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CardCount { get; set; }
    public static SubstackResponseDto FromEntity(Substack substack, int cardCount) => new()
    {
        Id = substack.Id,
        StackId = substack.StackId,
        Name = substack.Name,
        CardCount = cardCount
    };
}

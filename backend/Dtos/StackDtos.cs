using backend.Entities;

namespace backend.Dtos;

public class StackResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CardCount { get; set; }

    public static StackResponseDto FromEntity(Stack stack, int cardCount) => new()
    {
        Id = stack.Id,
        Name = stack.Name,
        CardCount = cardCount
    };
}

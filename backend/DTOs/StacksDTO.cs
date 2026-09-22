using backend.Entities;

namespace backend.Dtos;

public class StackResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public static StackResponseDto FromEntity(Stack stack) => new()
    {
        Id = stack.Id,
        Name = stack.Name
    };
}

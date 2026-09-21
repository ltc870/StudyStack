using backend.Entities;

namespace backend.Dtos;

public class StacksDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public static StacksDto FromEntity(Stack stack) => new()
    {
        Id = stack.Id,
        Name = stack.Name
    };
}

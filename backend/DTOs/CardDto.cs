using backend.Entities;

namespace backend.Dtos;

public class CardRequestDto
{
    public int StackId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}

public class CardUpdateDto
{
    public string? Question { get; set; }
    public string? Answer { get; set; }
}

public class CardResponseDto
{
    public int Id { get; set; }
    public int StackId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;

    public static CardResponseDto FromEntity(Card card) => new()
    {
        Id = card.Id,
        StackId = card.StackId,
        Question = card.Question,
        Answer = card.Answer,
    };
}
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using backend.Entities;

namespace backend.Dtos;

public class CardRequestDto
{
    public int StackId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public bool IsMonospace { get; set; } = false;
    public int? SubstackId { get; set; }
}

public class CardUpdateDto
{
    public string? Question { get; set; }
    public string? Answer { get; set; }
    public bool? IsMonospace { get; set; }
}

public class MoveCardsDto
{
    [JsonRequired]
    [MinLength(1)]
    [MaxLength(1000)]
    public List<int> CardIds { get; set; } = [];
    [JsonRequired]
    public int? SubstackId { get; set; }
}

public class CardResponseDto
{
    public int Id { get; set; }
    public int StackId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public bool IsMonospace { get; set; } = false;
    public int? SubstackId { get; set; }

    public static CardResponseDto FromEntity(Card card) => new()
    {
        Id = card.Id,
        StackId = card.StackId,
        Question = card.Question,
        Answer = card.Answer,
        IsMonospace = card.IsMonospace,
        SubstackId = card.SubstackId,
    };
}

namespace backend.Entities;

public class Card
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    
    public int StackId { get; set; }
    public Stack Stack { get; set; } = null!;
}
namespace backend.Entities;

public class Stack
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public List<Card> Cards { get; set; } = new();
}
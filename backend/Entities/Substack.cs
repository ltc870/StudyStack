namespace backend.Entities;

public class Substack
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int StackId { get; set; }
    public Stack Stack { get; set; } = null!;
    public List<Card> Cards { get; set; } = [];
}

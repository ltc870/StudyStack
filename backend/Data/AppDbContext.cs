using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Stack> Stacks => Set<Stack>();
    public DbSet<Card> Cards => Set<Card>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(user => user.Username).IsUnique();
        
        modelBuilder.Entity<Stack>()
            .HasOne(stack => stack.User)
            .WithMany(user => user.Stacks)
            .HasForeignKey(stack => stack.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Card>()
            .HasOne(card => card.Stack)
            .WithMany(stack => stack.Cards)
            .HasForeignKey(card => card.StackId)
            .OnDelete(DeleteBehavior.Cascade);
        
        modelBuilder.Entity<RefreshToken>()
            .HasOne(token => token.User)
            .WithMany(user => user.RefreshTokens)
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
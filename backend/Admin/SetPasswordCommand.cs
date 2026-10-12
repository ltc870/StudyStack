using System.Text;
using backend.Data;
using backend.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Admin;

/// <summary>
/// Admin command: sets a user's password from the console and signs out their existing sessions.
/// Usage: dotnet backend.dll set-password <username>
/// </summary>
public static class SetPasswordCommand
{
    private const int MinimumLength = 12;

    public static async Task<bool> RunAsync(IServiceProvider services, string username)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

        var user = await db.Users
            .Include(user => user.RefreshTokens)
            .FirstOrDefaultAsync(user => user.Username == username);

        if (user is null)
        {
            Console.Error.WriteLine($"No user named '{username}' exists. Nothing was changed");
            return false;
        }
        
        var password = ReadHidden($"New password for '{username}' (at least {MinimumLength} characters): ");
        if (password.Length < MinimumLength)
        {
            Console.Error.WriteLine($"Password must be at least {MinimumLength} characters. Nothing was changed.");
            return false;
        }

        var confirmation = ReadHidden("Type it again to confirm: ");
        if (password != confirmation)
        {
            Console.Error.WriteLine("The two entries did not match. Nothing was changed.");
            return false;
        }

        user.PasswordHash = hasher.HashPassword(user, password);

        foreach (var token in user.RefreshTokens.Where(t => !t.IsRevoked)) // LINQ: only tokens still active
        {
            token.IsRevoked = true;
        }

        await db.SaveChangesAsync();

        Console.WriteLine($"Password updated for '{username}'. Existing sessions were signed out.");
        return true;
    }
    
    // Reads a line from the keyboard without showing it: prints * per character and handles Backspace.
    private static string ReadHidden(string prompt)
    {
        Console.Write(prompt);
        var input = new StringBuilder();

        while (true)
        {
            var key = Console.ReadKey(intercept: true);

            if (key.Key == ConsoleKey.Enter)
            {
                Console.WriteLine();
                return input.ToString();
            }

            if (key.Key == ConsoleKey.Backspace)
            {
                if (input.Length > 0)
                {
                    input.Length--;
                    Console.Write("\b \b");
                }
                continue;
            }

            if (!char.IsControl(key.KeyChar))
            {
                input.Append(key.KeyChar);
                Console.Write('*');
            }
        }
    }
}
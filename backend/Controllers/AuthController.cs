using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Data;
using backend.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IConfiguration _configuration;
    
    public AuthController(AppDbContext dbContext, IPasswordHasher<User> passwordHasher, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
    }

    // GET
    
    // POST
    [HttpPost("login")]
    public async Task<IActionResult> Login()
    {
        return Ok();
    }

    private static string GenerateJwt(User user, IConfiguration config)
    {
        // Claims are the actual "payload" of the token -- the facts it asserts.
        // NameIdentifier is the conventional claim type for "who is this token for."
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username)
        };

        // Pull the signing key out of config (this reads from User Secrets locally).
        var signingKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(config["Jwt:SigningKey"]!));

        // Pairs the key with the algorithm used to produce the signature.
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        // Assembles the actual token: who it's for (claims), how long it's valid,
        // and how it's signed.
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: credentials
        );
        
        // Serializes the token object into the header.payload.signature string
        // that actually gets sent to the client.
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
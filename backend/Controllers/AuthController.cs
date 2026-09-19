using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.DTOs;
using backend.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    public async Task<IActionResult> Login(LoginRequestDTO request)
    {
        // Look up the user by request.Username in _db.Users
        var user = await _dbContext.Users.FirstOrDefaultAsync(user => user.Username == request.Username);
        
        // If no user was found, return Unauthorized
        if (user == null)
        {
            return Unauthorized();
        }
        
        // Verify the password matches the stored hash
        var passwordVerificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        
        // Check if verification passes or fails
        if (passwordVerificationResult == PasswordVerificationResult.Failed)
        {
            return Unauthorized();
        }
        
        // Generate the JWT
        var jwt = GenerateJwt(user, _configuration);
        
        // Generate a raw refresh token
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        
        // Has the raw value with SHA256
        var hashedRefreshToken = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        var tokenHash = Convert.ToBase64String(hashedRefreshToken);
        
        // Create and save a new RefreshToken
        var refreshTokenEntity = new RefreshToken()
        {
            TokenHash = tokenHash,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
            
        };
        
        _dbContext.RefreshTokens.Add(refreshTokenEntity);
        await _dbContext.SaveChangesAsync();
        
        // Set the refresh token in the response
        Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = refreshTokenEntity.ExpiresAt
        });

        return Ok(new {token = jwt});
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
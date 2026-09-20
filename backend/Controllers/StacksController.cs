using System.Security.Claims;
using backend.Data;
using backend.DTOs;
using backend.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static System.Int32;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StacksController : ControllerBase
{
    
    private readonly AppDbContext _dbContext;
    public StacksController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    // GET
    
    // POST
    [HttpPost]
    public async Task<IActionResult> CreateStack(StacksDTO stackDto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (!int.TryParse(userId, out var userIdInt))
        {
            return Unauthorized();
        }

        var stack = new Stack
        {
            Name = stackDto.Name,
            UserId = userIdInt
        };
        _dbContext.Stacks.Add(stack);
        await _dbContext.SaveChangesAsync();
        return Ok(stack);
    }
}
using System.Security.Claims;
using backend.Data;
using backend.Dtos;
using backend.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


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
    [HttpGet("get-all-stacks")]
    public async Task<IActionResult> GetAllStacks()
    {
        if (GetUserId() is not { } userId) return Unauthorized();
        
        var stacks = await _dbContext.Stacks
            .Where(stack => stack.UserId == userId)
            .ToListAsync();
        
        var stacksDto = stacks.Select(StackResponseDto.FromEntity);

        return Ok(stacksDto);
    }

    [HttpGet("get-stack/{stackId}")]
    public async Task<IActionResult> GetStackById(int stackId)
    {
        if (GetUserId() is not { } userId) return Unauthorized();
        
        var stack = await _dbContext.Stacks
            .FirstOrDefaultAsync(stack => stack.Id == stackId && stack.UserId == userId);

        if (stack is null) return NotFound();

        return Ok(StackResponseDto.FromEntity(stack));
    }
    
    // POST
    [HttpPost("create-stack")]
    public async Task<IActionResult> CreateStack(StackResponseDto stackDto)
    {
        if (GetUserId() is not { } userId) return Unauthorized();

        var stack = new Stack
        {
            Name = stackDto.Name,
            UserId = userId
        };

        _dbContext.Stacks.Add(stack);
        await _dbContext.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetAllStacks), new { stackId = stack.Id }, StackResponseDto.FromEntity(stack));
    }

    // PUT
    [HttpPut("update-stack/{stackId}")]
    public async Task<IActionResult> UpdateStackById(int stackId, StackResponseDto stackDto)
    {
        if (GetUserId() is not { } userId) return Unauthorized();
        
        var stack = await _dbContext.Stacks
            .FirstOrDefaultAsync(stack => stack.Id == stackId && stack.UserId == userId);
        
        if (stack is null) return NotFound();

        stack.Name = stackDto.Name;
        await _dbContext.SaveChangesAsync();

        return Ok(StackResponseDto.FromEntity(stack));
    }
    
    // DELETE
    [HttpDelete("delete-stack/{stackId}")]
    public async Task<IActionResult> DeleteStackById(int stackId)
    {
        if (GetUserId() is not { } userId) return Unauthorized();

        var stack = await _dbContext.Stacks
            .FirstOrDefaultAsync(stack => stack.Id == stackId && stack.UserId == userId);

        if (stack is null) return NotFound();
        
        _dbContext.Stacks.Remove(stack);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    private int? GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userId, out var userIdInt) ? userIdInt : null;
    }
}
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

        var stacksDto = await _dbContext.Stacks
            .Where(stack => stack.UserId == userId)
            .Select(stack => new StackResponseDto
            {
                Id = stack.Id,
                Name = stack.Name,
                CardCount = stack.Cards.Count,
                SubstackCount = stack.Substacks.Count
            })
            .ToListAsync();

        return Ok(stacksDto);
    }

    [HttpGet("get-stack/{stackId}")]
    public async Task<IActionResult> GetStackById(int stackId)
    {
        if (GetUserId() is not { } userId) return Unauthorized();

        var stackDto = await _dbContext.Stacks
            .Where(stack => stack.Id == stackId && stack.UserId == userId)
            .Select(stack => new StackResponseDto
            {
                Id = stack.Id,
                Name = stack.Name,
                CardCount = stack.Cards.Count,
                SubstackCount = stack.Substacks.Count
            })
            .FirstOrDefaultAsync();

        if (stackDto is null) return NotFound();

        return Ok(stackDto);
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

        return Ok(StackResponseDto.FromEntity(stack, cardCount: 0, substackCount: 0));
    }

    // PUT
    [HttpPut("update-stack/{stackId}")]
    public async Task<IActionResult> UpdateStackById(int stackId, StackResponseDto stackDto)
    {
        if (GetUserId() is not { } userId) return Unauthorized();

        var stack = await _dbContext.Stacks
            .FirstOrDefaultAsync(stack => stack.Id == stackId && stack.UserId == userId);

        if (stack is null) return NotFound();

        var cardCount = await _dbContext.Cards.CountAsync(card => card.StackId == stackId);

        var substackCount = await _dbContext.Substacks.CountAsync(substack => substack.StackId == stackId);

        stack.Name = stackDto.Name;
        await _dbContext.SaveChangesAsync();

        return Ok(StackResponseDto.FromEntity(stack, cardCount, substackCount));
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

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
public class SubstacksController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public SubstacksController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("get-substacks-by-stack/{stackId}")]
    public async Task<ActionResult<List<SubstackResponseDto>>> GetSubstacksByStackId(int stackId)
    {
        // Make sure it's the right user
        if (GetUserId() is not { } userId) return Unauthorized();

        // Get the correct stack
        var stackExists = await _dbContext.Stacks
            .AnyAsync(stack => stack.Id == stackId && stack.UserId == userId);

        // Make sure the stack was found
        if (!stackExists) return NotFound();

        // Get the substack
        var substackResponseDtos = await _dbContext.Substacks
            .Where(substack => substack.StackId == stackId)
            .OrderBy(substack => substack.Id)
            .Select(substack => new SubstackResponseDto
            {
                Id = substack.Id,
                Name = substack.Name,
                StackId = substack.StackId,
                CardCount = substack.Cards.Count
            })
            .ToListAsync();

        return Ok(substackResponseDtos);
    }

    [HttpGet("get-substack/{substackId}")]
    public async Task<IActionResult> GetSubstack(int substackId)
    {
        // Make sure it's the right user
        if (GetUserId() is not { } userId) return Unauthorized();

        // Get the substackDto
        var substackDto = await _dbContext.Substacks
            .Where(substack => substack.Id == substackId && substack.Stack.UserId == userId)
            .Select(substack => new SubstackResponseDto
            {
                Id = substack.Id,
                Name = substack.Name,
                StackId = substack.StackId,
                CardCount = substack.Cards.Count
            })
            .FirstOrDefaultAsync();

        if (substackDto is null) return NotFound();

        return Ok(substackDto);
    }

    [HttpPost("create-substack")]
    public async Task<IActionResult> CreateSubstack(SubstackCreateDto substackCreateDto)
    {
        // Make sure the user is the right user
        if (GetUserId() is not { } userId) return Unauthorized();

        // Make sure the parent stack exists
        var stackExists = await _dbContext.Stacks
            .AnyAsync(stack => stack.Id == substackCreateDto.StackId && stack.UserId == userId);

        if (!stackExists) return NotFound();

        // Map the dto to a new substack
        var substack = new Substack
        {
            StackId = substackCreateDto.StackId,
            Name = substackCreateDto.Name,
        };

        _dbContext.Substacks.Add(substack);
        await _dbContext.SaveChangesAsync();

        return Ok(SubstackResponseDto.FromEntity(substack, cardCount: 0));
    }

    [HttpPut("update-substack/{substackId}")]
    public async Task<IActionResult> UpdateSubstack(int substackId, SubstackUpdateDto substackUpdateDto)
    {
        // Make sure this is the correct user
        if (GetUserId() is not { } userId) return Unauthorized();

        // Get the substack
        var substack = await _dbContext.Substacks
            .FirstOrDefaultAsync(substack => substack.Id == substackId && substack.Stack.UserId == userId);

        // Make sure the substack exists
        if (substack is null) return NotFound();

        // Get the card count
        var cardCount = await _dbContext.Cards.CountAsync(card => card.SubstackId == substackId);

        // Update the name of the substack
        substack.Name = substackUpdateDto.Name;
        await _dbContext.SaveChangesAsync();

        // Return the response
        return Ok(SubstackResponseDto.FromEntity(substack, cardCount));
    }

    [HttpDelete("delete-substack/{substackId}")]
    public async Task<IActionResult> DeleteSubstack(int substackId)
    {
        // Make sure the user is the correct user
        if (GetUserId() is not { } userId) return Unauthorized();

        // Get the substack
        var substack = await _dbContext.Substacks
            .FirstOrDefaultAsync(substack => substack.Id == substackId && substack.Stack.UserId == userId);

        // Make sure the substack is not null
        if (substack is null) return NotFound();

        // Remove the substack
        _dbContext.Substacks.Remove(substack);
        await _dbContext.SaveChangesAsync();

        // Return no content
        return NoContent();
    }

    private int? GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userId, out var userIdInt) ? userIdInt : null;
    }
}

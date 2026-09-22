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
public class CardsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CardsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    // GET
    [HttpGet("get-cards-by-stack/{stackId}")]
    public async Task<ActionResult<List<CardResponseDto>>> GetAllCardsByStack(int stackId)
    {
        // Get the userId from the token, bail if missing
        if (GetUserId() is not { } userId) return Unauthorized();
        
        // Get the correct stack
        var stack = await _dbContext.Stacks
            .FirstOrDefaultAsync(stack => stack.Id == stackId && userId == stack.UserId);
        
        // Make sure the stack exists
        if (stack == null) return NotFound();
        
        // Get the cards
        var cards = await _dbContext.Cards
            .Where(card => card.StackId == stackId)
            .OrderBy(card => card.Id)
            .ToListAsync();
        
        // Map the cards to the CardResponseDto
        var cardResponseDtos = cards
            .Select(CardResponseDto.FromEntity).ToList();
        
        return Ok(cardResponseDtos);
    }
    
    // POST
    [HttpPost("create-card")]
    public async Task<IActionResult> CreateCard(CardDto cardDto)
    {
        // Get the userId from the token, bail if missing
        if (GetUserId() is not { } userId) return Unauthorized();
        
        // Get the right stack
        var stack = await _dbContext.Stacks.FirstOrDefaultAsync(
            stack => stack.Id == cardDto.StackId && stack.UserId == userId);
        
        // Make sure the stack exists
        if (stack is null) return NotFound();

        // Create the card
        var card = new Card()
        {
            Answer = cardDto.Answer,
            Question = cardDto.Question,
            StackId = stack.Id
        };
        
        // Save and return the newly created card
        _dbContext.Cards.Add(card);
        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAllCardsByStack), new { stackId = stack.Id }, CardResponseDto.FromEntity(card));
    }
    
    // Private Methods
    private int? GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userId, out var userIdInt) ? userIdInt : null;
    }
}
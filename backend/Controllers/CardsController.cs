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
    public async Task<IActionResult> CreateCard(CardRequestDto cardRequestDto)
    {
        // Get the userId from the token, bail if missing
        if (GetUserId() is not { } userId) return Unauthorized();
        
        // Get the right stack
        var stack = await _dbContext.Stacks.FirstOrDefaultAsync(
            stack => stack.Id == cardRequestDto.StackId && stack.UserId == userId);
        
        // Make sure the stack exists
        if (stack is null) return NotFound();

        // Create the card
        var card = new Card()
        {
            Answer = cardRequestDto.Answer,
            Question = cardRequestDto.Question,
            StackId = stack.Id
        };
        
        // Save and return the newly created card
        _dbContext.Cards.Add(card);
        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAllCardsByStack), new { stackId = stack.Id }, CardResponseDto.FromEntity(card));
    }
    
    // Update
    [HttpPut("update-card/{cardId}")]
    public async Task<IActionResult> UpdateCardById(int cardId, CardUpdateDto cardUpdateDto)
    {
        // Get the userid from the token, bail if missing
        if (GetUserId() is not { } userId) return Unauthorized();
        
        // Get the card by filtering on the stack and making sure it belongs to the correct user
        var card = await _dbContext.Cards
            .FirstOrDefaultAsync(card =>  card.Id == cardId && card.Stack.UserId == userId);
        
        // Make sure the card is found
        if (card is null) return NotFound();
        
        // Check the cardUpdateDto. If or empty null, then leave the question as is, if not null, then 
        // assign cardUpdateDto.Question to card.Question
        if (cardUpdateDto.Question != null)
        {
            card.Question = cardUpdateDto.Question;
        }
        
        // // Check the cardUpdateDto. If null or empty, then leave the answer as is, if not null, then 
        // assign cardUpdateDto.Question to card.Answer
        if (cardUpdateDto.Answer != null)
        {
            card.Answer = cardUpdateDto.Answer;
        }
        
        // Save changes made
        await _dbContext.SaveChangesAsync();

        // Return the updated card
        return Ok(CardResponseDto.FromEntity(card));
    }
    
    // DELETE
    [HttpDelete("delete-card/{cardId}")]
    public async Task<IActionResult> DeleteCardById(int cardId)
    {
        // Get the userId
        if (GetUserId() is not { } userId) return Unauthorized();
        
        // Get the card
        var card = await _dbContext.Cards
            .FirstOrDefaultAsync(card => card.Id == cardId && card.Stack.UserId == userId);
        
        // Make sure the card exists
        if (card is null) return NotFound();
        
        // Delete the card
        _dbContext.Remove(card);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }
    
    // Private Methods
    private int? GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userId, out var userIdInt) ? userIdInt : null;
    }
}
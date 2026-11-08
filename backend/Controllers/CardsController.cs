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
            .OrderBy(card => card.SubstackId == null)
            .ThenBy(card => card.SubstackId)
            .ThenBy(card => card.Id)
            .ToListAsync();

        // Map the cards to the CardResponseDto
        var cardResponseDtos = cards
            .Select(CardResponseDto.FromEntity).ToList();

        return Ok(cardResponseDtos);
    }

    [HttpGet("get-cards-by-substack/{substackId}")]
    public async Task<ActionResult<List<CardResponseDto>>> GetAllCardsBySubstack(int substackId)
    {
        // Get the userId from the token, bail if missing
        if (GetUserId() is not { } userId) return Unauthorized();

        // Get any correct substack
        var substackExists = await _dbContext.Substacks
            .AnyAsync(substack => substack.Id == substackId && substack.Stack.UserId == userId);

        // Make sure the substack exists
        if (!substackExists) return NotFound();

        // Get the correct set of cards
        var cards = await _dbContext.Cards
            .Where(card => card.SubstackId == substackId)
            .OrderBy(card => card.Id)
            .ToListAsync();

        // Map from request to dto
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

        // If the substackId is not null, make sure the substack exists
        if (cardRequestDto.SubstackId is not null)
        {
            var substackExists = await _dbContext.Substacks
                .AnyAsync(substack => substack.Id == cardRequestDto.SubstackId
                                      && substack.StackId == stack.Id
                                      && substack.Stack.UserId == userId);

            if (!substackExists) return NotFound();
        }

        // Create the card
        var card = new Card()
        {
            Answer = cardRequestDto.Answer,
            Question = cardRequestDto.Question,
            StackId = stack.Id,
            IsMonospace = cardRequestDto.IsMonospace,
            SubstackId = cardRequestDto.SubstackId
        };

        // Save and return the newly created card
        _dbContext.Cards.Add(card);
        await _dbContext.SaveChangesAsync();
        return Ok(CardResponseDto.FromEntity(card));
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

        if (cardUpdateDto.IsMonospace != null)
        {
            card.IsMonospace = cardUpdateDto.IsMonospace.Value;
        }

        // Save changes made
        await _dbContext.SaveChangesAsync();

        // Return the updated card
        return Ok(CardResponseDto.FromEntity(card));
    }

    [HttpPut("move-cards")]
    public async Task<ActionResult<List<CardResponseDto>>> MoveCards(MoveCardsDto moveCardsDto)
    {
        // Get the userid from the token, bail if missing
        if (GetUserId() is not { } userId) return Unauthorized();

        // Make sure that we have the right amount of cards that's moving.
        if (moveCardsDto.CardIds.Count != moveCardsDto.CardIds.Distinct().Count())
        {
            return BadRequest("Each card id may only appear once.");
        }

        // Get the cards that belong to the user and the specific stack
        var cards = await _dbContext.Cards
            .Where(card => moveCardsDto.CardIds.Contains(card.Id) && card.Stack.UserId == userId)
            .ToListAsync();

        // Make sure the number of cards matches the number of cards to be moved
        if (cards.Count != moveCardsDto.CardIds.Count) return NotFound();

        // Get the first card's stackId
        var stackId = cards[0].StackId;

        // Make sure that all of the cards have the right stackId
        if (cards.Any(card => card.StackId != stackId)) return NotFound();

        // Make sure the substack exists
        if (moveCardsDto.SubstackId is not null)
        {
            var substackExists = await _dbContext.Substacks
                .AnyAsync(substack => substack.Id == moveCardsDto.SubstackId
                                      && substack.StackId == stackId
                                      && substack.Stack.UserId == userId);

            if (!substackExists) return NotFound();
        }

        // Assign each card's substackId the correct substackId
        foreach (var card in cards)
        {
            card.SubstackId = moveCardsDto.SubstackId;
        }

        // Save the changes
        await _dbContext.SaveChangesAsync();

        // Return the cardResponseDtos
        var cardResponseDtos = cards
            .OrderBy(card => card.Id)
            .Select(CardResponseDto.FromEntity).ToList();

        return Ok(cardResponseDtos);
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

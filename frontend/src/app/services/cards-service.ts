import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Card, CardCreateRequest, CardUpdateRequest, MoveCardsRequest } from '../models/card';

@Service()
export class CardsService {
  // Dependency Injection
  private http = inject(HttpClient);

  // Endpoints
  private readonly getAllCardsByStackEndpoint = '/api/Cards/get-cards-by-stack/';
  private readonly getAllCardsBySubstackEndpoint = '/api/Cards/get-cards-by-substack/';
  private readonly createCardEndpoint = '/api/Cards/create-card';
  private readonly updateCardByIdEndpoint = '/api/Cards/update-card/';
  private readonly moveCardsEndpoint = '/api/Cards/move-cards';
  private readonly deleteCardByIdEndpoint = '/api/Cards/delete-card/';

  // GET
  getAllCardsByStack(stackId: number): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.getAllCardsByStackEndpoint}${stackId}`);
  }

  getAllCardsBySubstack(substackId: number): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.getAllCardsBySubstackEndpoint}${substackId}`);
  }

  // POST
  createCard(card: CardCreateRequest): Observable<Card> {
    return this.http.post<Card>(`${this.createCardEndpoint}`, card);
  }

  // PUT
  updateCardById(cardId: number, card: CardUpdateRequest): Observable<Card> {
    return this.http.put<Card>(`${this.updateCardByIdEndpoint}${cardId}`, card);
  }

  moveCards(request: MoveCardsRequest): Observable<Card[]> {
    return this.http.put<Card[]>(`${this.moveCardsEndpoint}`, request);
  }

  // DELETE
  deleteCardById(cardId: number): Observable<void> {
    return this.http.delete<void>(`${this.deleteCardByIdEndpoint}${cardId}`);
  }
}

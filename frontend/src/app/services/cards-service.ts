import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Card, CardCreateRequest, CardUpdateRequest } from '../models/card';

@Service()
export class CardsService {
  // Dependency Injection
  private http = inject(HttpClient);

  // Endpoints
  private readonly baseUrl = 'https://localhost:7285';
  private readonly getAllCardsByStackEndpoint = '/api/Cards/get-cards-by-stack/';
  private readonly createCardEndpoint = '/api/Cards/create-card';
  private readonly updateCardByIdEndpoint = '/api/Cards/update-card/';
  private readonly deleteCardByIdEndpoint = '/api/Cards/delete-card/';

  // GET
  getAllCardsByStack(stackId: number): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.baseUrl}${this.getAllCardsByStackEndpoint}${stackId}`);
  }

  // POST
  createCard(card: CardCreateRequest): Observable<Card> {
    return this.http.post<Card>(`${this.baseUrl}${this.createCardEndpoint}`, card);
  }

  // PUT
  updateCardById(cardId: number, card: CardUpdateRequest): Observable<Card> {
    return this.http.put<Card>(`${this.baseUrl}${this.updateCardByIdEndpoint}${cardId}`, card);
  }

  // DELETE
  deleteCardById(cardId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${this.deleteCardByIdEndpoint}${cardId}`);
  }
}

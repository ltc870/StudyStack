import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Card } from '../models/card';

@Service()
export class CardsService {
    // Dependency Injection
    private http = inject(HttpClient);

    // Endpoints
    private readonly baseUrl = "https://localhost:7285";
    private readonly getAllCardsByStackEndpoint = "/api/Cards/get-cards-by-stack/";

    // GET
    getAllCardsByStack(stackId: number): Observable<Card[]> {
        return this.http.get<Card[]>(`${this.baseUrl}${this.getAllCardsByStackEndpoint}${stackId}`);
    }
}

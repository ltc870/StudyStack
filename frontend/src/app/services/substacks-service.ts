import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Substack, SubstackCreateRequest, SubstackUpdateRequest } from '../models/substack';

@Service()
export class SubstacksService {
  // Dependency Injection
  private http = inject(HttpClient);

  // Endpoints
  private readonly getSubstacksByStackEndpoint = '/api/Substacks/get-substacks-by-stack/';
  private readonly getSubstackByIdEndpoint = '/api/Substacks/get-substack/';
  private readonly createSubstackEndpoint = '/api/Substacks/create-substack';
  private readonly updateSubstackByIdEndpoint = `/api/Substacks/update-substack/`;
  private readonly deleteSubstackByIdEndpoint = '/api/Substacks/delete-substack/';

  // GET
  getSubstacksByStack(stackId: number): Observable<Substack[]> {
    return this.http.get<Substack[]>(`${this.getSubstacksByStackEndpoint}${stackId}`);
  }

  getSubstackById(substackId: number): Observable<Substack> {
    return this.http.get<Substack>(`${this.getSubstackByIdEndpoint}${substackId}`);
  }

  // POST
  createSubstack(substack: SubstackCreateRequest): Observable<Substack> {
    return this.http.post<Substack>(`${this.createSubstackEndpoint}`, substack);
  }

  // PUT
  updateSubstackById(substackId: number, substack: SubstackUpdateRequest): Observable<Substack> {
    return this.http.put<Substack>(`${this.updateSubstackByIdEndpoint}${substackId}`, substack);
  }

  // DELETE
  deleteSubstackById(substackId: number): Observable<void> {
    return this.http.delete<void>(`${this.deleteSubstackByIdEndpoint}${substackId}`);
  }
}

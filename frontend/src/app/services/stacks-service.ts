import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stack } from '../models/stack';

@Service()
export class StacksService {
  // Dependency Injection
  private http = inject(HttpClient);

  // Endpoints
  private readonly baseUrl = 'https://localhost:7285';
  private readonly getAllStacksEndpoint = '/api/Stacks/get-all-stacks';
  private readonly getStackByIdEndpoint = '/api/Stacks/get-stack/';
  private readonly createStackEndpoint = '/api/Stacks/create-stack';
  private readonly updateStackByIdEndpoint = `/api/Stacks/update-stack/`;
  private readonly deleteStackByIdEndpoint = '/api/Stacks/delete-stack/';

  // GET
  getAll(): Observable<Stack[]> {
    return this.http.get<Stack[]>(`${this.baseUrl}${this.getAllStacksEndpoint}`);
  }

  getStackById(stackId: number): Observable<Stack> {
    return this.http.get<Stack>(`${this.baseUrl}${this.getStackByIdEndpoint}${stackId}`);
  }

  // POST
  createStack(name: string): Observable<Stack> {
    return this.http.post<Stack>(`${this.baseUrl}${this.createStackEndpoint}`, { name: name });
  }

  // PUT
  updateStackById(stackId: number, name: string): Observable<Stack> {
    return this.http.put<Stack>(`${this.baseUrl}${this.updateStackByIdEndpoint}${stackId}`, {
      name: name,
    });
  }

  // DELETE
  deleteStackById(stackId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${this.deleteStackByIdEndpoint}${stackId}`);
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';

@Service()
export class Auth {
    private readonly http = inject(HttpClient)
    private accessToken: string | null = null;
    private readonly authState = new BehaviorSubject<boolean>(false);
    readonly isAuthenticated = this.authState.asObservable();
    private readonly baseUrl = "https://localhost:7285";
    private readonly refreshEndpoint = "/api/Auth/refresh";
    private readonly loginEndpoint = "/api/Auth/login"

    getAccessToken(): string | null {
        return this.accessToken;
    }

    // Add authentication methods here, e.g., login, logout, checkAuthStatus
    async initializeAuth(): Promise<void> {
        try{
            const response = await firstValueFrom(
                this.http.post<TokenResponse>(
                    `${this.baseUrl}${this.refreshEndpoint}`,
                    {}, 
                    {withCredentials: true}
                )
            );

            this.accessToken = response.token;
            this.authState.next(true);
        }catch {
            this.accessToken = null;
            this.authState.next(false);
        }
        
    }

    get isLoggedIn(): boolean {
        return this.authState.value;
    }

    async login(credentials: { username: string; password: string }): Promise<void> {
        const response = await firstValueFrom(
            this.http.post<TokenResponse>(
                `${this.baseUrl}${this.loginEndpoint}`,
                credentials,
                {withCredentials: true}
            )
        );

        this.accessToken = response.token;
        this.authState.next(true);  
    }

    logout() {}
}

import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  imports: [],
  selector: 'app-logout-button',
  styleUrl: './logout-button.scss',
  templateUrl: './logout-button.html',
})
export class LogoutButton {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isAuthenticated = toSignal(this.authService.isAuthenticated$, {
    initialValue: this.authService.isLoggedIn,
  });

  onLogout() {
    this.authService.logout().subscribe({
      error: (error) => console.error('Logout request failed', error),
    });

    void this.router.navigateByUrl('/login');
  }
}

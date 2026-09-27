import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [],
  selector: 'app-logout-button',
  styleUrl: './logout-button.scss',
  templateUrl: './logout-button.html',
})
export class LogoutButton {
  authService = inject(AuthService)

  onLogout() {
    this.authService.logout().subscribe();
  }
}

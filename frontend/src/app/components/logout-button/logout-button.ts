import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth-service';

@Component({
  imports: [],
  selector: 'app-logout-button',
  styleUrl: './logout-button.scss',
  templateUrl: './logout-button.html',
})
export class LogoutButton {
  authState = inject(AuthService)

  onLogout() {
    this.authState.logout();
  }
}

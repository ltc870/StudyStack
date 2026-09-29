import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorPlayFill } from '@ng-icons/phosphor-icons/fill';
import { phosphorPlusBold } from '@ng-icons/phosphor-icons/bold';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [RouterLink, NgIcon],
  providers: [provideIcons({ phosphorPlayFill, phosphorPlusBold })],
  selector: 'app-welcome',
  styleUrl: './welcome.scss',
  templateUrl: './welcome.html',
})
export class Welcome {
  private authService = inject(AuthService);

  isAuthenticated = toSignal(this.authService.isAuthenticated$);
}

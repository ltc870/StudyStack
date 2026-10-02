import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorCaretLeftBold } from '@ng-icons/phosphor-icons/bold';

@Component({
  imports: [NgIcon],
  providers: [provideIcons({ phosphorCaretLeftBold })],
  selector: 'app-back-link',
  styleUrl: './back-link.scss',
  templateUrl: './back-link.html',
})
export class BackLink {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly routeData = toSignal(this.route.data);

  get backTo(): string | undefined {
    return this.routeData()?.['backTo'];
  }

  navigateBack(): void {
    if (this.backTo) {
      this.router.navigateByUrl(this.backTo);
    }
  }
}
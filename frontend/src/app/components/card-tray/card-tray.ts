import { Component, input, output, ElementRef, inject, afterNextRender } from '@angular/core';
import { Card } from '../../models/card';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorX } from '@ng-icons/phosphor-icons/regular';

@Component({
  imports: [NgIcon],
  providers: [provideIcons({ phosphorX })],
  selector: 'app-card-tray',
  styleUrl: './card-tray.scss',
  templateUrl: './card-tray.html',
  host: { '(document:keydown.escape)': 'closeRequested.emit()' },
})
export class CardTray {
  // Dependency Injection
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  // Inputs
  cards = input.required<Card[]>();
  currentIndex = input.required<number>();

  // Outputs
  cardSelected = output<number>();
  closeRequested = output<void>();

  constructor() {
    afterNextRender(() => {
      this.host.nativeElement.querySelector<HTMLButtonElement>('.card-tray-item--current')?.focus();
    });
  }
}

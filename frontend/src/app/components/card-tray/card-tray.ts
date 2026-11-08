import {
  Component,
  input,
  output,
  ElementRef,
  inject,
  afterNextRender,
  computed,
} from '@angular/core';
import { Card } from '../../models/card';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorX } from '@ng-icons/phosphor-icons/regular';
import { Substack } from '../../models/substack';

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

  // Inputs & Outputs
  cards = input.required<Card[]>();
  currentIndex = input.required<number>();
  substacks = input<Substack[]>([]);
  title = input<string>('Cards in this stack');
  cardSelected = output<number>();
  closeRequested = output<void>();

  // Computed Signals
  cardGroups = computed<{ name: string | null; entries: { card: Card; index: number }[] }[]>(() => {
    const indexedCards = this.cards().map((card, index) => ({ card, index }));

    if (this.substacks().length === 0) {
      return [{ name: null, entries: indexedCards }];
    }

    const substackGroups = this.substacks().map((substack) => ({
      name: substack.name,
      entries: indexedCards.filter((entry) => entry.card.substackId === substack.id),
    }));

    const substackIdsSet = new Set(this.substacks().map((substack) => substack.id));

    const unsortedGroup = {
      name: 'Not in a substack',
      entries: indexedCards.filter(
        (entry) => entry.card.substackId === null || !substackIdsSet.has(entry.card.substackId),
      ),
    };

    return [...substackGroups, unsortedGroup].filter((group) => group.entries.length > 0);
  });

  constructor() {
    afterNextRender(() => {
      this.host.nativeElement.querySelector<HTMLButtonElement>('.card-tray-item--current')?.focus();
    });
  }
}

import { Component, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { BackLink } from '../../components/back-link/back-link';
import { rxResource } from '@angular/core/rxjs-interop';
import { StacksService } from '../../services/stacks-service';
import { CardsService } from '../../services/cards-service';
import { Card } from '../../models/card';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorPlusBold, phosphorTrashBold } from '@ng-icons/phosphor-icons/bold';
import { phosphorMagnifyingGlassLight } from '@ng-icons/phosphor-icons/light';
import { phosphorPencilSimple } from '@ng-icons/phosphor-icons/regular';

@Component({
  imports: [BackLink, NgIcon],
  providers: [
    provideIcons({
      phosphorPlusBold,
      phosphorMagnifyingGlassLight,
      phosphorPencilSimple,
      phosphorTrashBold,
    }),
  ],
  selector: 'app-manage-cards',
  styleUrl: './manage-cards.scss',
  templateUrl: './manage-cards.html',
})
export class ManageCards {
  // Dependency Injection
  stacksService = inject(StacksService);
  cardsService = inject(CardsService);

  // Signals
  stackId = input.required<number, unknown>({ transform: numberAttribute });
  searchQuery = signal<string>('');

  // Computed Signals
  cardCount = computed(() => {
    return this.stackResource.value()?.cardCount;
  });

  filteredCards = computed<Card[]>(() => {
    if (!this.cardResource.hasValue()) return [];
    const rawCards = this.cardResource.value();
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) {
      return rawCards;
    }

    return rawCards.filter(
      (card) =>
        card.question.toLowerCase().includes(query) || card.answer.toLowerCase().includes(query),
    );
  });

  hasNoCards = computed(
    () =>
      !this.cardResource.isLoading() &&
      this.cardResource.hasValue() &&
      this.cardResource.value().length === 0,
  );

  noMatches = computed(
    () =>
      !this.cardResource.isLoading() &&
      this.cardResource.hasValue() &&
      this.cardResource.value().length > 0 &&
      this.filteredCards().length === 0,
  );

  // HTTP
  stackResource = rxResource({
    params: () => this.stackId(),
    stream: ({ params }) => this.stacksService.getStackById(params),
  });

  cardResource = rxResource({
    defaultValue: [],
    params: () => this.stackId(),
    stream: ({ params }) => this.cardsService.getAllCardsByStack(params),
  });

  // Helper functions
  updateText(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }
}

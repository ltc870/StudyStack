import { Component, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { BackLink } from '../../components/back-link/back-link';
import { rxResource } from '@angular/core/rxjs-interop';
import { StacksService } from '../../services/stacks-service';
import { CardsService } from '../../services/cards-service';
import { Card, CardCreateRequest } from '../../models/card';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorPlusBold, phosphorTrashBold } from '@ng-icons/phosphor-icons/bold';
import { phosphorMagnifyingGlassLight } from '@ng-icons/phosphor-icons/light';
import { phosphorPencilSimple } from '@ng-icons/phosphor-icons/regular';
import { CardEditorModal } from '../../components/card-editor-modal/card-editor-modal';

@Component({
  imports: [BackLink, NgIcon, CardEditorModal],
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
  editorState = signal<{ mode: 'create' | 'edit'; card: Card | null } | null>(null);

  // Computed Signals
  cardCount = computed(() => {
    if (!this.cardResource.hasValue()) return 0;
    return this.cardResource.value().length;
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

  onNewCardClick() {
    this.editorState.set({ mode: 'create', card: null });
  }

  onEditClick(card: Card, event: Event) {
    event.stopPropagation();
    this.editorState.set({ mode: 'edit', card });
  }

  onEditorSave(value: Omit<CardCreateRequest, 'stackId'>) {
    if (this.editorState()?.mode === 'create') {
      this.cardsService.createCard({ stackId: this.stackId(), ...value }).subscribe({
        next: (response) => {
          console.log('Submission successful: ', response);
          this.editorState.set(null);
          this.cardResource.reload();
        },
        error: (err) => {
          console.log('Failed to create new card: ', err);
        },
      });
    } else {
      const card = this.editorState()!.card!;
      this.cardsService.updateCardById(card.id, value).subscribe({
        next: (response) => {
          console.log('Update successful: ', response);
          this.editorState.set(null);
          this.stackResource.reload();
        },
        error: (err) => {
          console.log('Failed to update Stack: ', err);
        },
      });
    }
  }
}

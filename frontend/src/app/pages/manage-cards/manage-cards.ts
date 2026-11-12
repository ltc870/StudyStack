import { Component, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { BackLink } from '../../components/back-link/back-link';
import { rxResource } from '@angular/core/rxjs-interop';
import { StacksService } from '../../services/stacks-service';
import { CardsService } from '../../services/cards-service';
import { Card, CardCreateRequest } from '../../models/card';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorPlusBold, phosphorTrashBold } from '@ng-icons/phosphor-icons/bold';
import { phosphorMagnifyingGlassLight } from '@ng-icons/phosphor-icons/light';
import {
  phosphorCheckSquare,
  phosphorFolderSimple,
  phosphorPencilSimple,
} from '@ng-icons/phosphor-icons/regular';
import { CardEditorModal } from '../../components/card-editor-modal/card-editor-modal';
import { DeleteConfirmationModal } from '../../components/delete-confirmation-modal/delete-confirmation-modal';
import { RouterLink } from '@angular/router';
import { SubstacksService } from '../../services/substacks-service';
import { of, switchMap } from 'rxjs';

@Component({
  imports: [BackLink, NgIcon, CardEditorModal, DeleteConfirmationModal, RouterLink],
  providers: [
    provideIcons({
      phosphorPlusBold,
      phosphorMagnifyingGlassLight,
      phosphorPencilSimple,
      phosphorTrashBold,
      phosphorFolderSimple,
      phosphorCheckSquare,
    }),
  ],
  selector: 'app-manage-cards',
  styleUrl: './manage-cards.scss',
  templateUrl: './manage-cards.html',
})
export class ManageCards {
  // Dependency Injection
  stacksService = inject(StacksService);
  substacksService = inject(SubstacksService);
  cardsService = inject(CardsService);

  // Inputs
  stackId = input.required<number, unknown>({ transform: numberAttribute });

  // State
  searchQuery = signal<string>('');
  editorState = signal<{ mode: 'create' | 'edit'; card: Card | null } | null>(null);
  deleteTarget = signal<Card | null>(null);
  isSelecting = signal<boolean>(false);
  selectedCardIds = signal<Set<number>>(new Set());

  // HTTP
  stackResource = rxResource({
    params: () => this.stackId(),
    stream: ({ params }) => this.stacksService.getStackById(params),
  });

  substackResource = rxResource({
    defaultValue: [],
    params: () => this.stackId(),
    stream: ({ params }) => this.substacksService.getSubstacksByStack(params),
  });

  cardResource = rxResource({
    defaultValue: [],
    params: () => this.stackId(),
    stream: ({ params }) => this.cardsService.getAllCardsByStack(params),
  });

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

  selectedCount = computed(() => this.selectedCardIds().size);

  cardGroups = computed<{ substackId: number | null; name: string; cards: Card[] }[]>(() => {
    const substacks = this.substackResource.hasValue() ? this.substackResource.value() : [];
    const cards = this.filteredCards();
    const substackIds = new Set(substacks.map((substack) => substack.id));

    const substackGroups = substacks.map((substack) => ({
      substackId: substack.id,
      name: substack.name,
      cards: cards.filter((card) => card.substackId === substack.id),
    }));

    const unsortedGroup = {
      substackId: null,
      name: 'Not in a substack',
      cards: cards.filter((card) => card.substackId === null || !substackIds.has(card.substackId)),
    };

    const mergedGroups = [...substackGroups, unsortedGroup];

    return mergedGroups.filter(
      (group) =>
        group.cards.length > 0 || (group.substackId !== null && this.searchQuery().trim() === ''),
    );
  });

  hasSubstacks = computed(() => {
    return this.substackResource.hasValue() && this.substackResource.value().length > 0;
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

  // Select mode
  onSelectClick() {
    this.isSelecting.set(true);
  }

  onCancelSelect() {
    this.isSelecting.set(false);
    this.selectedCardIds.set(new Set());
  }

  toggleCard(cardId: number) {
    this.selectedCardIds.update((currentSelectedIds) => {
      const newIdsSet = new Set(currentSelectedIds);
      if (!newIdsSet.has(cardId)) {
        newIdsSet.add(cardId);
      } else {
        newIdsSet.delete(cardId);
      }
      return newIdsSet;
    });
  }

  selectAllShown() {
    const filteredCardIds = this.filteredCards().map((card) => card.id);
    const newCombinedSet = new Set([...this.selectedCardIds(), ...filteredCardIds]);
    this.selectedCardIds.set(newCombinedSet);
  }

  clearSelection() {
    this.selectedCardIds.set(new Set());
  }

  // Search
  updateText(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  // Card editor
  onNewCardClick() {
    this.editorState.set({ mode: 'create', card: null });
  }

  onEditClick(card: Card) {
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
      const substackChanged = value.substackId !== card.substackId;

      this.cardsService
        .updateCardById(card.id, value)
        .pipe(
          switchMap(() =>
            substackChanged
              ? this.cardsService.moveCards({ cardIds: [card.id], substackId: value.substackId })
              : of(null),
          ),
        )
        .subscribe({
          next: (response) => {
            console.log('Update successful: ', response);
            this.editorState.set(null);
            this.cardResource.reload();
          },
          error: (err) => {
            console.log('Failed to update Stack: ', err);
          },
        });
    }
  }

  // Delete
  onDeleteClick(card: Card) {
    this.deleteTarget.set(card);
  }

  onDeleteConfirmed() {
    const cardId = this.deleteTarget()?.id!;
    this.cardsService.deleteCardById(cardId).subscribe({
      next: (response) => {
        console.log('Delete successful: ', response);
        this.deleteTarget.set(null);
        this.cardResource.reload();
      },
      error: (err) => {
        console.log('Failed to delete Card: ', err);
      },
    });
  }
}

import { Component, inject, input, numberAttribute, computed, linkedSignal } from '@angular/core';
import { BackLink } from '../../components/back-link/back-link';
import { StacksService } from '../../services/stacks-service';
import { CardsService } from '../../services/cards-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Card } from '../../models/card';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorCaretLeft, phosphorCaretRight } from '@ng-icons/phosphor-icons/regular';

@Component({
  imports: [BackLink, NgIcon],
  providers: [provideIcons({ phosphorCaretLeft, phosphorCaretRight })],
  selector: 'app-study',
  styleUrl: './study.scss',
  templateUrl: './study.html',
})
export class Study {
  // Dependency Injection
  stacksService = inject(StacksService);
  cardsService = inject(CardsService);

  // Signals
  stackId = input.required<number, unknown>({ transform: numberAttribute });

  // Linked Signals
  currentIndex = linkedSignal({
    source: () => this.stackId(),
    computation: () => 0,
  });

  isFlipped = linkedSignal({
    source: () => this.stackId(),
    computation: () => false,
  });

  // Computed Signals
  cardCount = computed(() => {
    if (!this.cardResource.hasValue()) return 0;
    return this.cardResource.value().length;
  });

  currentCard = computed<Card | null>(() => {
    if (!this.cardResource.hasValue()) return null;
    return this.cardResource.value()[this.currentIndex()] ?? null;
  });

  hasPrevious = computed<boolean>(() => this.currentIndex() > 0);

  hasNext = computed<boolean>(() => this.currentIndex() < this.cardCount() - 1);

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

  // Helper Functions
  goTo(index: number) {
    if (index < 0 || !(index < this.cardCount())) return;

    this.currentIndex.set(index);
    this.isFlipped.set(false);
  }

  next() {
    this.goTo(this.currentIndex() + 1);
  }

  previous() {
    this.goTo(this.currentIndex() - 1);
  }

  flip() {
    this.isFlipped.update((flipped) => !flipped);
  }
}

import {
  Component,
  inject,
  input,
  numberAttribute,
  computed,
  linkedSignal,
  signal,
} from '@angular/core';
import { BackLink } from '../../components/back-link/back-link';
import { StacksService } from '../../services/stacks-service';
import { CardsService } from '../../services/cards-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Card } from '../../models/card';

@Component({
  imports: [BackLink],
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
    return this.cardResource.value()[this.currentIndex() ?? null];
  });

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
}

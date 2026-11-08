import {
  Component,
  inject,
  input,
  numberAttribute,
  computed,
  linkedSignal,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackLink } from '../../components/back-link/back-link';
import { StacksService } from '../../services/stacks-service';
import { CardsService } from '../../services/cards-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Card } from '../../models/card';
import { CardTray } from '../../components/card-tray/card-tray';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { MarkdownComponent, MARKED_OPTIONS, provideMarkdown } from 'ngx-markdown';
import {
  phosphorSidebarSimple,
  phosphorCaretLeft,
  phosphorCaretRight,
  phosphorCards,
} from '@ng-icons/phosphor-icons/regular';
import { SubstacksService } from '../../services/substacks-service';
import { Substack } from '../../models/substack';

@Component({
  imports: [BackLink, NgIcon, RouterLink, MarkdownComponent, CardTray],
  providers: [
    provideIcons({ phosphorCaretLeft, phosphorCaretRight, phosphorCards, phosphorSidebarSimple }),
    provideMarkdown({
      markedOptions: {
        provide: MARKED_OPTIONS,
        useValue: {
          gfm: true, // GitHub-flavored markdown: fenced code, tables, strikethrough
          breaks: true, // a single Enter in the textarea stays a line break
        },
      },
    }),
  ],
  selector: 'app-study',
  styleUrl: './study.scss',
  templateUrl: './study.html',
})
export class Study {
  // Dependency Injection
  stacksService = inject(StacksService);
  cardsService = inject(CardsService);
  substacksService = inject(SubstacksService);

  // Inputs
  stackId = input.required<number, unknown>({ transform: numberAttribute });
  substackId = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) => (value == null ? undefined : numberAttribute(value)),
  });

  // Signals
  isTrayOpen = signal(false);

  // Linked Signals
  currentIndex = linkedSignal({
    source: () => ({ stackId: this.stackId(), substackId: this.substackId() }),
    computation: () => 0,
  });

  isFlipped = linkedSignal({
    source: () => ({ stackId: this.stackId(), substackId: this.substackId() }),
    computation: () => false,
  });

  // Computed Signals
  isSingleSubstack = computed<boolean>(() => this.substackId() !== undefined);

  currentSubstack = computed<Substack | undefined>(() => {
    if (!this.isSingleSubstack() || !this.substackResource.hasValue()) {
      return undefined;
    }
    return this.substackResource.value().find((substack) => substack.id === this.substackId());
  });

  currentCardTopic = computed<string | undefined>(() => {
    const card = this.currentCard();
    if (this.isSingleSubstack()) return undefined;
    if (!card || card.substackId === null) return undefined;
    if (!this.substackResource.hasValue()) return undefined;
    return this.substackResource.value().find((substack) => substack.id === card.substackId)?.name;
  });

  traySubstacks = computed<Substack[]>(() => {
    if (this.isSingleSubstack() || !this.substackResource.hasValue()) return [];
    return this.substackResource.value();
  });

  trayTitle = computed<string>(() => {
    if (this.isSingleSubstack()) return 'Cards in this substack';
    return 'Cards in this stack';
  });

  emptyStateText = computed<string>(() => {
    if (this.isSingleSubstack()) return 'Add a few cards to start studying this substack.';
    return 'Add a few cards to start studying this stack.';
  });

  backAddress = computed<string>(() => {
    if (
      this.isSingleSubstack() ||
      (this.stackResource.hasValue() && this.stackResource.value().substackCount > 0)
    ) {
      return `/stacks/study/${this.stackId()}`;
    }
    return '/stacks/study';
  });

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

  hasNoCards = computed(
    () =>
      !this.cardResource.isLoading() &&
      this.cardResource.hasValue() &&
      this.cardResource.value().length === 0,
  );

  // Queries
  trayToggle = viewChild<ElementRef<HTMLButtonElement>>('trayToggle');

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
    params: () => ({ stackId: this.stackId(), substackId: this.substackId() }),
    stream: ({ params }) => {
      if (params.substackId !== undefined) {
        return this.cardsService.getAllCardsBySubstack(params.substackId);
      }
      return this.cardsService.getAllCardsByStack(params.stackId);
    },
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

  toggleTray() {
    this.isTrayOpen.update((opened) => !opened);
  }

  closeTray() {
    this.isTrayOpen.set(false);
    this.trayToggle()?.nativeElement.focus();
  }
}

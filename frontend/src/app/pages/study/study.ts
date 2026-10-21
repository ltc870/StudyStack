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

  // Signals
  stackId = input.required<number, unknown>({ transform: numberAttribute });
  isTrayOpen = signal(false);

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

  toggleTray() {
    this.isTrayOpen.update((opened) => !opened);
  }

  closeTray() {
    this.isTrayOpen.set(false);
    this.trayToggle()?.nativeElement.focus();
  }
}

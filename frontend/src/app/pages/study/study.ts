import { Component, inject, input, numberAttribute } from '@angular/core';
import { BackLink } from '../../components/back-link/back-link';
import { StacksService } from '../../services/stacks-service';
import { CardsService } from '../../services/cards-service';
import { rxResource } from '@angular/core/rxjs-interop';

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

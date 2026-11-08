import { Component, inject, input, numberAttribute } from '@angular/core';
import { BackLink } from '../../components/back-link/back-link';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorCaretRight } from '@ng-icons/phosphor-icons/regular';
import { StacksService } from '../../services/stacks-service';
import { SubstacksService } from '../../services/substacks-service';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  imports: [BackLink, RouterLink, NgIcon],
  providers: [provideIcons({ phosphorCaretRight })],
  selector: 'app-choose-what-to-study',
  styleUrl: './choose-what-to-study.scss',
  templateUrl: './choose-what-to-study.html',
})
export class ChooseWhatToStudy {
  // Dependency Injection
  stacksService = inject(StacksService);
  substacksService = inject(SubstacksService);

  // Input
  stackId = input.required<number, unknown>({ transform: numberAttribute });

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

  // Helper Methods
  cardCountLabel(count: number): string {
    return count === 1 ? '1 card' : `${count} cards`;
  }
}

import { Component, computed, input, output, signal } from '@angular/core';
import { Substack } from '../../models/substack';

@Component({
  imports: [],
  selector: 'app-move-cards-modal',
  styleUrl: './move-cards-modal.scss',
  templateUrl: './move-cards-modal.html',
})
export class MoveCardsModal {
  // Inputs and Outputs
  stackName = input.required<string>();
  count = input.required<number>();
  substacks = input.required<Substack[]>();
  errorMessage = input<string | null>(null);
  isMoving = input<boolean>(false);
  move = output<number | null>();
  cancelled = output<void>();

  // State
  selectedChoice = signal<number | 'unsorted' | null>(null);

  // Computed Signals
  title = computed(() => (this.count() === 1 ? 'Move 1 card' : `Move ${this.count()} cards`));

  onMoveClick() {
    const selectedChoice = this.selectedChoice();

    if (selectedChoice === 'unsorted') {
      this.move.emit(null);
    } else {
      this.move.emit(selectedChoice);
    }
  }
}

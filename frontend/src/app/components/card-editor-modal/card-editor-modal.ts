import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { Card, CardCreateRequest } from '../../models/card';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixCloseFill } from '@ng-icons/remixicon';

@Component({
  imports: [NgIcon],
  providers: [provideIcons({ remixCloseFill })],
  selector: 'app-card-editor-modal',
  styleUrl: './card-editor-modal.scss',
  templateUrl: './card-editor-modal.html',
})
export class CardEditorModal {
  // Signals
  mode = input<'create' | 'edit'>('create');
  card = input<Card | null>(null);
  question = linkedSignal(() => this.card()?.question ?? '');
  answer = linkedSignal(() => this.card()?.answer ?? '');
  isMonospace = linkedSignal(() => this.card()?.isMonospace ?? false);
  save = output<Omit<CardCreateRequest, 'stackId'>>();
  cancel = output<void>();

  // Computed Signals
  canSave = computed(() => {
    return this.question().trim().length > 0 && this.answer().trim().length > 0;
  });
  title = computed(() => (this.mode() === 'create' ? 'Add Card' : 'Edit Card'));

  // Helper Functions
  setQuestion(event: Event) {
    const input = event.target as HTMLInputElement;
    this.question.set(input.value);
  }

  setAnswer(event: Event) {
    const input = event.target as HTMLInputElement;
    this.answer.set(input.value);
  }

  setIsMonospace(event: Event) {
    const input = event.target as HTMLInputElement;
    this.isMonospace.set(input.checked);
  }

  onSave() {
    if (this.canSave()) {
      this.save.emit({
        question: this.question(),
        answer: this.answer(),
        isMonospace: this.isMonospace(),
      });
    }
  }
}

import { Component, computed, input, output, signal } from '@angular/core';
import { Stack } from '../../models/stack';

@Component({
  imports: [],
  selector: 'app-stack-editor-modal',
  styleUrl: './stack-editor-modal.scss',
  templateUrl: './stack-editor-modal.html',
})
export class StackEditorModal {
  // Signals
  mode = input<'manage' | 'rename'>('manage');
  stack = input<Stack | null>(null);
  name = signal(this.stack()?.name ?? '');
  closed = output<void>();
  canSave = computed(() => this.name().trim().length > 0);
  title = computed(() => this.mode() === 'manage' ? 'New Stack' : 'Rename Stack')
  save = output<string>();
  cancel = output<void>();
}

import { Component, computed, input, output, signal } from '@angular/core';
import { Stack } from '../../models/stack';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixCloseFill } from '@ng-icons/remixicon';

@Component({
  imports: [NgIcon],
  providers: [provideIcons({remixCloseFill})],
  selector: 'app-stack-editor-modal',
  styleUrl: './stack-editor-modal.scss',
  templateUrl: './stack-editor-modal.html',
})
export class StackEditorModal {
  // Signals
  mode = input<'create' | 'rename'>('create');
  stack = input<Stack | null>(null);
  name = signal(this.stack()?.name ?? '');
  closed = output<void>();
  canSave = computed(() => this.name().trim().length > 0);
  title = computed(() => this.mode() === 'create' ? 'New Stack' : 'Rename Stack')
  save = output<string>();
  cancel = output<void>();

  // Helper Functions
}

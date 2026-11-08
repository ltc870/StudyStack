import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixCloseFill } from '@ng-icons/remixicon';

@Component({
  imports: [NgIcon],
  providers: [provideIcons({ remixCloseFill })],
  selector: 'app-stack-editor-modal',
  styleUrl: './stack-editor-modal.scss',
  templateUrl: './stack-editor-modal.html',
})
export class StackEditorModal {
  // Signals
  mode = input<'create' | 'rename'>('create');
  item = input<{ name: string } | null>(null);
  kind = input<'stack' | 'substack'>('stack');

  save = output<string>();
  cancel = output<void>();

  name = linkedSignal(() => this.item()?.name ?? '');

  canSave = computed(() => this.name().trim().length > 0);
  title = computed(() => {
    const isCreate = this.mode() === 'create';

    if (this.kind() === 'substack') {
      return isCreate ? 'New Substack' : 'Rename Substack';
    }

    return isCreate ? 'New Stack' : 'Rename Stack';
  });
  label = computed(() => {
    return this.kind() === 'stack' ? 'STACK NAME' : 'SUBSTACK NAME';
  });
  placeholder = computed(() => {
    return this.kind() === 'stack' ? 'e.g. C# Fundamentals' : 'e.g. Async/Await';
  });

  // Helper Functions
  setName(event: Event) {
    const input = event.target as HTMLInputElement;
    this.name.set(input.value);
  }

  onEnter() {
    if (this.canSave()) {
      this.save.emit(this.name());
    }
  }
}

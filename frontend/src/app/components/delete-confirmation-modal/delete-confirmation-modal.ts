import { Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorTrashBold } from '@ng-icons/phosphor-icons/bold';

@Component({
  imports: [NgIcon],
  providers: [provideIcons({
    phosphorTrashBold
  })
],
  selector: 'app-delete-confirmation-modal',
  styleUrl: './delete-confirmation-modal.scss',
  templateUrl: './delete-confirmation-modal.html',
})
export class DeleteConfirmationModal {
  // Signals
  title = input<string>('Delete Stack')
  itemLabel = input<string>('');
  cascadeWarning = input<string | null>(null);

  deleteWarning = computed(() => {
    if (this.cascadeWarning() === null) {
      return `This will permanently delete ${this.itemLabel()}.` +
      ` and all 24 of its cards. This cannot be undone.`
    } else {
      return `This will permanently delete ${this.itemLabel()}.` +
      ` This cannot be do undone.`
    }
  })

  confirmed = output<void>();
  cancelled = output<void>();
}

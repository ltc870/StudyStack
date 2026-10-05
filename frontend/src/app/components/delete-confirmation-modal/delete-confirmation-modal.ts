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
     const cascade = this.cascadeWarning();
     const extra = cascade ? ` ${cascade}` : '';
     return `This will permanently delete ${this.itemLabel()}${extra}. This cannot be undone.`;
   });

  confirmed = output<void>();
  cancelled = output<void>();
}

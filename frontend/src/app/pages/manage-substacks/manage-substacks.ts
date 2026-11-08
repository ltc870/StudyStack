import { Component, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { StacksService } from '../../services/stacks-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { SubstacksService } from '../../services/substacks-service';
import { Substack } from '../../models/substack';
import { BackLink } from '../../components/back-link/back-link';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorPlusBold, phosphorTrashBold } from '@ng-icons/phosphor-icons/bold';
import { phosphorMagnifyingGlassLight } from '@ng-icons/phosphor-icons/light';
import { phosphorPencilSimple } from '@ng-icons/phosphor-icons/regular';
import { StackEditorModal } from '../../components/stack-editor-modal/stack-editor-modal';
import { DeleteConfirmationModal } from '../../components/delete-confirmation-modal/delete-confirmation-modal';

@Component({
  imports: [BackLink, NgIcon, StackEditorModal, DeleteConfirmationModal],
  providers: [
    provideIcons({
      phosphorPlusBold,
      phosphorMagnifyingGlassLight,
      phosphorPencilSimple,
      phosphorTrashBold,
    }),
  ],
  selector: 'app-manage-substacks',
  styleUrl: './manage-substacks.scss',
  templateUrl: './manage-substacks.html',
})
export class ManageSubstacks {
  stacksService = inject(StacksService);
  substacksService = inject(SubstacksService);
  stackId = input.required<number, unknown>({ transform: numberAttribute });

  searchQuery = signal<string>('');
  editorState = signal<{ mode: 'create' | 'rename'; substack: Substack | null } | null>(null);
  deleteTarget = signal<Substack | null>(null);

  stackResource = rxResource({
    params: () => this.stackId(),
    stream: ({ params }) => this.stacksService.getStackById(params),
  });

  substackResource = rxResource({
    defaultValue: [],
    params: () => this.stackId(),
    stream: ({ params }) => this.substacksService.getSubstacksByStack(params),
  });

  filteredSubstacks = computed<Substack[]>(() => {
    if (!this.substackResource.hasValue()) return [];
    const rawSubstacks = this.substackResource.value();
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) {
      return rawSubstacks;
    }

    return rawSubstacks.filter((substack) => substack.name.toLowerCase().includes(query));
  });

  hasNoSubstacks = computed(
    () =>
      !this.substackResource.isLoading() &&
      this.substackResource.hasValue() &&
      this.substackResource.value().length === 0,
  );

  noMatches = computed(
    () =>
      !this.substackResource.isLoading() &&
      this.substackResource.hasValue() &&
      this.substackResource.value().length > 0 &&
      this.filteredSubstacks().length === 0,
  );

  updateText(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onNewSubstackClick() {
    this.editorState.set({ mode: 'create', substack: null });
  }

  onEditClick(substack: Substack) {
    this.editorState.set({ mode: 'rename', substack });
  }

  onEditorSave(name: string) {
    if (this.editorState()?.mode === 'create') {
      this.substacksService.createSubstack({ stackId: this.stackId(), name }).subscribe({
        next: (response) => {
          console.log('Submission successful: ', response);
          this.editorState.set(null);
          this.substackResource.reload();
        },
        error: (err) => {
          console.log('Failed to create new substack: ', err);
        },
      });
    } else {
      const substack = this.editorState()!.substack!;
      this.substacksService.updateSubstackById(substack.id, { name }).subscribe({
        next: (response) => {
          console.log('Submission successful: ', response);
          this.editorState.set(null);
          this.substackResource.reload();
        },
        error: (err) => {
          console.log('Failed to update Substack: ', err);
        },
      });
    }
  }

  onDeleteClick(substack: Substack): void {
    this.deleteTarget.set(substack);
  }

  deleteMessage(substack: Substack): string {
    const stackName = this.stackResource.hasValue()
      ? this.stackResource.value().name
      : 'this stack';

    if (substack.cardCount === 0) {
      return `This will delete "${substack.name}". This cannot be undone.`;
    }

    const cards = substack.cardCount === 1 ? '1 card stays' : `${substack.cardCount} cards stay`;
    return `This will delete "${substack.name}". Its ${cards} in ${stackName}, under Not in a substack. This cannot be undone.`;
  }

  onDeleteConfirmed() {
    const substackId = this.deleteTarget()!.id;
    this.substacksService.deleteSubstackById(substackId).subscribe({
      next: (response) => {
        console.log('Delete successful: ', response);
        this.deleteTarget.set(null);
        this.substackResource.reload();
      },
      error: (err) => {
        console.log('Failed to delete Substack: ', err);
      },
    });
  }
}

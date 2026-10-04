import { Component, computed, inject, input, signal } from '@angular/core';
import { BackLink } from '../../components/back-link/back-link';
import { StacksService } from '../../services/stacks-service';
import { Stack } from '../../models/stack';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorPlusBold } from '@ng-icons/phosphor-icons/bold';
import { phosphorMagnifyingGlassLight } from '@ng-icons/phosphor-icons/light';
import { phosphorPencilSimple } from '@ng-icons/phosphor-icons/regular';
import { phosphorTrashBold } from '@ng-icons/phosphor-icons/bold';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { StackEditorModal } from '../../components/stack-editor-modal/stack-editor-modal';
import { DeleteConfirmationModal } from '../../components/delete-confirmation-modal/delete-confirmation-modal';

@Component({
  imports: [BackLink, NgIcon, StackEditorModal, DeleteConfirmationModal],
  providers: [provideIcons(
    {
      phosphorPlusBold, 
      phosphorMagnifyingGlassLight,
      phosphorPencilSimple,
      phosphorTrashBold 
    }
  )],
  selector: 'app-manage-stacks',
  styleUrl: './manage-stacks.scss',
  templateUrl: './manage-stacks.html',
})
export class ManageStacks {
  // Dependency Injection
  stacksService = inject(StacksService);
  private readonly router = inject(Router);

  // Signals
  mode = input<'manage' | 'study'>('manage');
  searchQuery = signal<string>('');
  deleteTarget = signal<Stack | null>(null)
  selectedId = signal<number | null>(null);
  editorState = signal<{mode: 'create' | 'rename'; stack: Stack | null} | null>(null)

  // Computed Signals
  title = computed(() => this.mode() === 'manage' ? 'Manage Stacks' : 'Choose a Stack');

  selectedStack = computed(() => {
    const stackList = this.stackResource.value() ?? [];
    const id = this.selectedId();
    return stackList.find(stack => stack.id === id);
  })

  filteredStacks = computed<Stack[]>(() => {
    const rawStacks = this.stackResource.value();
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) {
      return rawStacks
    }

    return rawStacks.filter(stack => stack.name.toLowerCase()
      .includes(query)
    )
  })

  // HTTP
  stackResource = rxResource({
    defaultValue: [],
    stream: () =>  this.stacksService.getAll()
  });

  // Helper functions
  updateText(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onRowClick(stack: Stack){
    if(this.mode() === 'manage') {
      this.router.navigateByUrl(`/stacks/${stack.id}/cards`);
    } else {
      this.router.navigateByUrl(`/study/${stack.id}`);
    }
  }

  onNewStackClick(){
    this.editorState.set({ mode: 'create', stack: null })
  }

  onEditorSave(name: string) {
    if (this.editorState()?.mode === 'create') {
      this.stacksService.createStack(name).subscribe({
        next: (response) => {
          console.log("Submission successful: ", response)
          this.editorState.set(null);
          this.stackResource.reload();
        },
        error: (err) => {
          console.log("Failed to create new Stack: ", err);
        }
      });
    } else {
      const stack = this.editorState()!.stack!;
      this.stacksService.updateStackById(stack.id, name).subscribe({
        next: (response) => {
          console.log("Update successful: ", response);
          this.editorState.set(null);
          this.stackResource.reload();
        },
        error: (err) => {
          console.log("Failed to update Stack: ", err);
        }
      })
    }
  }

  onEditClick(stack: Stack, event: Event){
    event.stopPropagation();
    this.editorState.set({mode: 'rename', stack});
  }

  onDeleteClick(stack: Stack, event: Event){
    event.stopPropagation();
    this.deleteTarget.set(stack);
  }

  onDeleteConfirmed() {
    const stackId = this.deleteTarget()?.id!;
    this.stacksService.deleteStackById(stackId).subscribe({
      next: (response) => {
        console.log("Delete successful: ", response);
        this.deleteTarget.set(null);
        this.stackResource.reload();
      },
      error: (err) => {
          console.log("Failed to delete Stack: ", err);
        }
    })
  }
}

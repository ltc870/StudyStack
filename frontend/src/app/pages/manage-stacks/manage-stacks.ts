import { Component, computed, inject, input, signal } from '@angular/core';
import { BackLink } from '../../components/back-link/back-link';
import { StacksService } from '../../services/stacks-service';
import { Stack } from '../../models/stack';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorPlusBold } from '@ng-icons/phosphor-icons/bold';
import { phosphorMagnifyingGlassLight } from '@ng-icons/phosphor-icons/light';
import { phosphorPencilSimple } from '@ng-icons/phosphor-icons/regular';
import { phosphorTrashBold } from '@ng-icons/phosphor-icons/bold';

@Component({
  imports: [BackLink, NgIcon],
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

  // Signals
  mode = input<'manage' | 'study'>('manage');
  stacks = signal<Stack[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');
  filteredStacks = computed(() => {
    return this.stacks().some(stack => stack.name === this.searchQuery());
  })
  title = computed(() => this.mode() === 'manage' ? 'Manage Stacks' : 'Chosose a Stack');

  loadStacks(){}

  onRowClick(stack: Stack){}

  onNewStackClick(){}

  onEditClick(stack: Stack){}

  onDeleteClick(stack: Stack){}
}

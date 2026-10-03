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
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');
  
  title = computed(() => this.mode() === 'manage' ? 'Manage Stacks' : 'Chosose a Stack');

  stackResource = rxResource({
    defaultValue: [],
    stream: () =>  this.stacksService.getAll()
  });

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

  updateText(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }


  onRowClick(stack: Stack){}

  onNewStackClick(){}

  onEditClick(stack: Stack){}

  onDeleteClick(stack: Stack){}
}

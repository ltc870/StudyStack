import { Component } from '@angular/core';
import { BackLink } from '../../components/back-link/back-link';

@Component({
  imports: [BackLink],
  selector: 'app-manage-stacks',
  styleUrl: './manage-stacks.scss',
  templateUrl: './manage-stacks.html',
})
export class ManageStacks {}

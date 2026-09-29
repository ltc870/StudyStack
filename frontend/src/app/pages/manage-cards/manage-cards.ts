import { Component } from '@angular/core';
import { BackLink } from '../../components/back-link/back-link';

@Component({
  imports: [BackLink],
  selector: 'app-manage-cards',
  styleUrl: './manage-cards.scss',
  templateUrl: './manage-cards.html',
})
export class ManageCards {}

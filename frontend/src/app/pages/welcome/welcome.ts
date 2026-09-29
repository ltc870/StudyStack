import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorPlayFill } from '@ng-icons/phosphor-icons/fill';
import { phosphorPlusBold } from '@ng-icons/phosphor-icons/bold';

@Component({
  imports: [NgIcon],
  providers: [provideIcons({ phosphorPlayFill, phosphorPlusBold })],
  selector: 'app-welcome',
  styleUrl: './welcome.scss',
  templateUrl: './welcome.html',
})
export class Welcome {
}

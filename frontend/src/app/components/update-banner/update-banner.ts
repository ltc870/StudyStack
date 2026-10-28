import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorArrowClockwise, phosphorWarningCircle } from '@ng-icons/phosphor-icons/regular';
import { remixCloseFill } from '@ng-icons/remixicon';
import { UpdateService } from '../../services/update-service';

@Component({
  imports: [NgIcon],
  providers: [provideIcons({ phosphorArrowClockwise, phosphorWarningCircle, remixCloseFill })],
  selector: 'app-update-banner',
  styleUrl: './update-banner.scss',
  templateUrl: './update-banner.html',
  host: { role: 'status' },
})
export class UpdateBanner {
  protected readonly updateService = inject(UpdateService);
}

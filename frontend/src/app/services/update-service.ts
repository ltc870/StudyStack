import { DOCUMENT, inject, Service, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, fromEvent } from 'rxjs';

@Service()
export class UpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly document = inject(DOCUMENT);

  // Only this service changes these
  private readonly isUpdateReadyState = signal(false);
  private readonly isReloadRequiredState = signal(false);

  // Read-only views for the banner
  readonly isUpdateReady = this.isUpdateReadyState.asReadonly();
  readonly isReloadRequired = this.isReloadRequiredState.asReadonly();

  constructor() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.setupUpdateListeners();
  }

  private setupUpdateListeners() {
    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.isUpdateReadyState.set(true);
      });

    this.swUpdate.unrecoverable.subscribe((event) => {
      this.isReloadRequiredState.set(true);
      console.error(`App is in an unrecoverable state: ${event.reason}`);
    });

    fromEvent(this.document, 'visibilitychange')
      .pipe(filter(() => this.document.visibilityState === 'visible'))
      .subscribe(() => {
        this.swUpdate.checkForUpdate().catch((err) => {
          console.warn('Failed to check for updates:', err);
        });
      });
  }

  reload() {
    this.document.location.reload();
  }

  dismiss() {
    this.isUpdateReadyState.set(false);
  }
}

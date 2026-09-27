import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorPlayFill, phosphorWarningCircleFill } from '@ng-icons/phosphor-icons/fill';
import { phosphorPlusBold } from '@ng-icons/phosphor-icons/bold';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [ReactiveFormsModule, NgIcon],
  providers: [provideIcons({ phosphorPlayFill, phosphorWarningCircleFill, phosphorPlusBold })],
  selector: 'app-welcome',
  styleUrl: './welcome.scss',
  templateUrl: './welcome.html',
})
export class Welcome {
  // Dependency Injection
  private formBuilder = inject(FormBuilder);
  authService = inject(AuthService)

  // Signals
  isAuthenticated = toSignal(this.authService.isAuthenticated);
  isSubmitting = signal<boolean>(false);
  isCredentialError = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.formBuilder.group({
    username: new FormControl<string>('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    password: new FormControl<string>('', {
      validators: [Validators.required],
      nonNullable: true,
    })
  })

  clearCredentialError() {
    if (!this.isCredentialError()) {
      return;
    }

    this.isCredentialError.set(false);
    this.errorMessage.set(null);
  }

  async onSubmit() {
    console.log("Submission attempted!");
    this.clearCredentialError();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.value as {username: string, password: string}

    this.isSubmitting.set(true);

    try {
      await this.authService.login(credentials);
    } catch (error) {
     if (error instanceof HttpErrorResponse && error.status === 401) {
      this.isCredentialError.set(true);
      this.errorMessage.set("Incorrect username or password");
     } else {
      this.errorMessage.set("Unable to reach the server");
     }
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorWarningCircleFill } from '@ng-icons/phosphor-icons/fill';

@Component({
  imports: [ReactiveFormsModule, NgIcon],
  providers: [provideIcons({ phosphorWarningCircleFill })],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

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
    this.clearCredentialError();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.value as {username: string, password: string}

    this.isSubmitting.set(true);

    try {
      await this.authService.login(credentials);
      this.router.navigateByUrl('/welcome');
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


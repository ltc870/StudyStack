import { Component } from '@angular/core';
import { LogoutButton } from '../logout-button/logout-button';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet, LogoutButton],
  selector: 'app-app-shell',
  styleUrl: './app-shell.scss',
  templateUrl: './app-shell.html',
})
export class AppShell {}

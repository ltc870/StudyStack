import { Component } from '@angular/core';
import { LogoutButton } from '../logout-button/logout-button';
import { RouterOutlet } from '@angular/router';
import { UpdateBanner } from '../update-banner/update-banner';

@Component({
  imports: [RouterOutlet, LogoutButton, UpdateBanner],
  selector: 'app-shell',
  styleUrl: './app-shell.scss',
  templateUrl: './app-shell.html',
})
export class AppShell {}

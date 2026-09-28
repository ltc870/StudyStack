import { Component, signal } from '@angular/core';
import { Welcome } from './pages/welcome/welcome';

@Component({
  imports: [Welcome],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');
}

import { Component } from '@angular/core';
import { BackLink } from '../../components/back-link/back-link';
import { releaseNotes } from './release-notes';

const releaseDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatReleaseDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return releaseDateFormat.format(new Date(year, month - 1, day));
}

@Component({
  imports: [BackLink],
  selector: 'app-updates',
  styleUrl: './updates.scss',
  templateUrl: './updates.html',
})
export class Updates {
  protected readonly releaseNotes = releaseNotes.map((releaseNote) => ({
    ...releaseNote,
    displayDate: formatReleaseDate(releaseNote.date),
  }));
}

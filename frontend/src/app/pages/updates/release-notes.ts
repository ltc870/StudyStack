import { ReleaseNote } from '../../models/release-note';

// What changed in each release, newest first. Shown on the Updates page.
//
// Add an entry at the top on the same branch as the change, for anything a
// user would notice. Write for the people using StudyStack: what's new and how
// to use it, never servers, Tailscale, backups or other admin work.
// date: the day it reaches production, as 'YYYY-MM-DD'.
export const releaseNotes: ReleaseNote[] = [
  {
    date: '2026-10-31',
    title: 'See what changed',
    changes: [
      'Tap "What\'s new" under the Manage and Study buttons to see this list of updates, newest first.',
    ],
  },
  {
    date: '2026-10-30',
    title: 'Formatting help',
    changes: [
      'Tap Formatting help in the card editor for a quick guide to bold, italics, lists, code and code blocks.',
    ],
  },
  {
    date: '2026-10-28',
    title: 'Updates without the guesswork',
    changes: [
      'When a new version of StudyStack is ready, a banner tells you. Tap Reload to switch to it, or X to keep going and get it next time you open the app.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'Jump to any card',
    changes: [
      'Tap Cards on the Study screen (the panel icon next to the stack name on a phone) to see every card in the stack. Tap one to jump straight to it; the list stays open.',
      'On an iPhone in landscape, the top bar now reaches the edges of the screen.',
    ],
  },
  {
    date: '2026-10-20',
    title: 'Faster start',
    changes: ['StudyStack opens faster, because it downloads less when it starts.'],
  },
  {
    date: '2026-10-14',
    title: 'Format your cards',
    changes: [
      'Questions and answers now support markdown: bold, italics, lists, code, and code blocks with colors.',
    ],
  },
  {
    date: '2026-10-12',
    title: 'StudyStack is online',
    changes: [
      'Make stacks of cards, each with a question and an answer, and find any of them with search.',
      'Study a stack: Flip shows the answer, and Previous and Next move between cards.',
      'Turn on Monospace font in the card editor for cards that are mostly code.',
      'Add it to your home screen: in Safari, tap Share, then Add to Home Screen.',
    ],
  },
];

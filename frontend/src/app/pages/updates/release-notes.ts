import { ReleaseNote } from '../../models/release-note';

// What changed in each release, newest first. Shown on the Updates page.
//
// Add an entry at the top on the same branch as the change, for anything a
// user would notice. Write for the people using StudyStack: what's new and how
// to use it, never servers, Tailscale, backups or other admin work.
// date: the day it reaches production, as 'YYYY-MM-DD'.
export const releaseNotes: ReleaseNote[] = [
  // NEW: bulk move. The date is a guess; set it to the day this reaches
  // production, and remove this comment, before the PR
  {
    date: '2026-11-12',
    title: 'Move several cards at once',
    changes: [
      'On a stack\'s cards, tap Select, tick the cards you want, then tap Move to ... and pick a substack or "Not in a substack". Select appears once a stack has at least one substack.',
      'Select all shown ticks every card your search is showing, so you can search for a topic and move all its cards together. Cards you ticked before a search stay ticked.',
      'On a phone, the search box now has a row of its own, with Select and Substacks underneath it.',
    ],
  },
  {
    date: '2026-11-08',
    title: 'Substacks',
    changes: [
      "Split a stack into substacks, like Async/Await inside C# Fundamentals. On a stack's cards, tap Substacks to add, rename or delete them.",
      'Choose a card\'s substack in the card editor. A stack\'s cards are grouped under their substacks, with "Not in a substack" last.',
      'Deleting a substack keeps its cards: they move to "Not in a substack".',
      'Study a whole stack or one substack. Tap a stack that has substacks and pick All cards or a substack.',
      'When you study a whole stack, the Cards list is grouped by substack, and each card shows its substack next to Question.',
    ],
  },
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

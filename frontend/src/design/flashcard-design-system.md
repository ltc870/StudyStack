# Flashcard Study PWA -- Design System

## Table of Contents
- [Design Goal](#design-goal)
- [Color Palette (Light)](#color-palette-light)
- [Color Rationale](#color-rationale)
- [Typography](#typography)
- [Typography Rationale](#typography-rationale)
- [Spacing and Surface Treatment](#spacing-and-surface-treatment)
- [Application Across the Four Screens](#application-across-the-four-screens)
- [Dark Mode Palette](#dark-mode-palette)
- [CSS Custom Properties Reference](#css-custom-properties-reference)

## Design Goal

The brief was a "focused study" mood, not generic app styling. That points away from high-energy, high-saturation UI (the kind built to hold attention through novelty) and toward something closer to a good reading room: calm, low-glare, unambiguous, with just enough color to guide the eye without competing for it. Everything below is chosen against that standard rather than against "looks modern."

## Color Palette (Light)

| Token | Swatch + Hex | Usage |
|---|---|---|
| `--color-bg` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#F6F4EF;border:1px solid #00000022;vertical-align:middle;margin-right:6px;"></span>`#F6F4EF` | Page background on all four screens (Welcome/Login, Manage Stacks, Manage Cards, Study), including the space behind the card editor modal before it opens |
| `--color-surface` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#FFFFFF;border:1px solid #00000022;vertical-align:middle;margin-right:6px;"></span>`#FFFFFF` | The top navigation bar; stack rows in Manage Stacks; card rows in Manage Cards; the card editor modal panel; the main flashcard surface in Study; search inputs; the username/password fields on Welcome/Login; individual card entries in the Study tray |
| `--color-surface-tint` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#FBFAF6;border:1px solid #00000022;vertical-align:middle;margin-right:6px;"></span>`#FBFAF6` | The Question/Answer textareas inside the card editor modal; the Study screen's card tray background (the panel listing cards in the open stack) |
| `--color-border` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#E3DFD5;border:1px solid #00000022;vertical-align:middle;margin-right:6px;"></span>`#E3DFD5` | The 1px outline on every surface above -- the nav bar's bottom divider, stack/card row outlines, the modal's outline, the Study card's outline, input field outlines (search, username, password, Q&A textareas), and the divider between the tray and main content in Study |
| `--color-text-primary` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#2A2924;border:1px solid #00000022;vertical-align:middle;margin-right:6px;"></span>`#2A2924` | Screen titles (h1) and stack names (h2); stack/card row primary text; typed values in form fields (username, question, answer content); the Study screen's question/answer text |
| `--color-text-secondary` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#6B675E;border:1px solid #00000022;vertical-align:middle;margin-right:6px;"></span>`#6B675E` | Card/stack counts ("24 cards"), the "Card 3 of 24" position indicator in Study; field labels (USERNAME, PASSWORD, QUESTION, ANSWER); input placeholder text; the secondary preview line under each stack/card row; the tagline under the StudyStack wordmark; the Cancel link in the card editor modal |
| `--color-primary` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#3E4C74;border:1px solid #00000022;vertical-align:middle;margin-right:6px;"></span>`#3E4C74` | The StudyStack wordmark/logo (nav bar and the Welcome/Login hero); the user-initials avatar circle in the nav bar; "New Stack" / "New Card" buttons; the card editor's "Save" button; the Study screen's "Flip" button; the Welcome screen's "Create" button; the Login form's "Log In" button |
| `--color-primary-hover` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#2F3B5C;border:1px solid #00000022;vertical-align:middle;margin-right:6px;"></span>`#2F3B5C` | Hover/active state for every button listed under `--color-primary` above |
| `--color-accent` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#5E8272;border:1px solid #00000022;vertical-align:middle;margin-right:6px;"></span>`#5E8272` | The Welcome screen's "Study" button; the empty-stack "Add Cards" button in Study; the active card's row highlight in the Study tray; the monospace-font toggle switch in the card editor |
| `--color-accent-hover` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#4A665A;border:1px solid #00000022;vertical-align:middle;margin-right:6px;"></span>`#4A665A` | Hover/active state for every button listed under `--color-accent` above (the Welcome "Study" button and the empty-stack "Add Cards" button -- not applicable to the tray highlight or the mono toggle, which aren't buttons) |
| `--color-warning` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#B15C3E;border:1px solid #00000022;vertical-align:middle;margin-right:6px;"></span>`#B15C3E` | Delete icons on stack rows and card rows; the destructive button in the delete-confirmation dialog; the Login form's error message text and icon; the username/password field borders specifically when a login attempt fails on wrong credentials (not on a server-unreachable failure, which keeps neutral borders) |
| `--color-warning-hover` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#96492F;border:1px solid #00000022;vertical-align:middle;margin-right:6px;"></span>`#96492F` | Hover/active state for the delete-confirmation dialog's destructive button |
| `--color-focus-ring` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#7C8FC4;border:1px solid #00000022;vertical-align:middle;margin-right:6px;"></span>`#7C8FC4` | Keyboard focus outline on any interactive element site-wide -- buttons, inputs, links, tray items -- when reached via Tab. Not shown in the static mockups (they don't depict interaction state), but should be applied uniformly in the actual CSS |

## Color Rationale

- **Warm off-white over stark white**: pure white backgrounds read as clinical and produce more glare over a long study session. A slightly warm, desaturated background (`#F6F4EF`) is easier on the eyes without looking dim or dated.
- **Deep indigo-blue as primary**: blue tones are consistently associated with calm and sustained concentration rather than urgency -- it's why so many productivity and reading tools lean blue rather than red or orange. `#3E4C74` is deep enough to feel serious and legible on light backgrounds, without tipping into the corporate-SaaS blue that most software already uses.
- **Muted sage-green as accent**: a secondary, lower-saturation color for actions like "Study" or the active-card indicator in the tray. Green in this desaturated register reads as steady and natural rather than "success/checkmark" green, keeping it distinct from any implied pass/fail signal.
- **Muted terracotta instead of pure red for destructive actions and errors**: delete needs to stand out, but a saturated red on every stack/card row (or every form error) creates low-grade alarm fatigue in a study tool you'll be looking at daily. Terracotta (`#B15C3E`) still reads clearly as "different, be careful" without the emergency-siren connotation of pure red. This same token is reused for form validation/error states (e.g. login failures) rather than introducing a separate error color, keeping the app's one "attention" hue consistent everywhere it appears.
- **Every hover token is a proportional darkening of its base color, not a hand-picked shade**: `--color-primary-hover`, `--color-warning-hover`, and `--color-accent-hover` are each roughly 20% darker than the token they pair with, keeping the amount of visual "press" consistent across every button in the app regardless of which base color it uses.
- **Everything as CSS custom properties**: none of this is hardcoded into components, which is what makes the [dark palette](#dark-mode-palette) below a token swap rather than a redesign.

## Typography

| Role | Font | Notes |
|---|---|---|
| Headings | Source Serif 4 | Weight 600-700; used for screen titles and section headers only |
| Body / UI text | Inter | Weight 400-500; all buttons, labels, list items, form fields |
| Code / Q&A content | JetBrains Mono | Ligatures explicitly disabled (see below) |

Type scale (rem, assuming 16px root):

| Token | Size | Line height | Used for |
|---|---|---|---|
| `--font-size-hero` | 2.875rem | 1.2 | The "StudyStack" wordmark on the Welcome/Login screen only -- not used anywhere else |
| `--font-size-h1` | 1.75rem | 1.3 | Screen titles (e.g. "Manage Stacks") |
| `--font-size-h2` | 1.25rem | 1.35 | Stack name in Manage Cards, modal titles |
| `--font-size-body` | 1rem | 1.5 | Default UI text, list items, buttons |
| `--font-size-meta` | 0.875rem | 1.4 | Timestamps, counts, secondary labels |
| `--font-size-label` | 0.6875rem | 1.3 | All-caps field labels (e.g. "USERNAME", "QUESTION") -- smallest text in the system, always paired with letter-spacing and never used for anything a user needs to read at a glance |
| `--font-size-code` | 0.95rem | 1.55 | Monospace question/answer content |

## Typography Rationale

- **A serif for headings, sans-serif for everything else**: this pairing (serif headings over a humanist sans body) is a deliberate nod to academic/library typography -- the kind of type hierarchy on a textbook title page or a lecture handout -- without going full serif-everywhere, which would hurt legibility in dense UI like stack lists and forms. It's a small cue, but it's the difference between "generic SaaS app" and "study tool."
- **Inter for body/UI**: chosen for screen legibility at small sizes and a large, well-hinted character set, so it holds up in dense list views (stack names, card counts, search results) as well as it does in buttons.
- **JetBrains Mono for code, with ligatures off**: since question/answer content will often contain actual code, a monospace option matters for alignment and readability of symbols. JetBrains Mono is a solid, widely-available choice for this. Ligatures are explicitly disabled (`font-variant-ligatures: none` and `font-feature-settings: "liga" 0, "calt" 0` on the code font class) so that `->`, `!=`, `=>`, and similar operators render as the literal characters typed rather than as combined glyphs -- consistent with keeping code text unambiguous and copy-paste-safe, and matching your own no-ligatures preference for code elsewhere.
- **Monospace is optional, not forced**: not every card is code -- some may be plain-language Q&A. The font toggle lives in the Study screen so it's a per-session reading preference rather than a global content format decision.
- **The hero wordmark is its own tier, not the h1**: the "StudyStack" title on Welcome/Login is a brand mark, not a screen title -- it doesn't compete with `--font-size-h1` because it isn't playing the same role. Earlier drafts of the mockups didn't document this size at all, which read as an inconsistency (the "heading" token looking smaller than other text on the page) even though the two were never meant to be the same thing. Adding `--font-size-hero` as its own named token resolves that: the hierarchy is now explicit -- hero (46px, Welcome/Login only) > h1 (28px, screen titles) > h2 (20px) > body (16px) > meta (14px) > label (11px).

## Spacing and Surface Treatment

- Base spacing unit: 8px, scaling in multiples (8/16/24/32) for padding and gaps -- keeps rhythm consistent across list rows, cards, and modals.
- Surfaces use a 1px `--color-border` outline rather than heavy drop shadows -- shadows read as "floating UI chrome"; flat outlines on a warm background read as calmer and more page-like.
- Corner radius: 8px on cards, buttons, and inputs -- soft enough to feel approachable, not so round it feels playful/game-like. Two intentional exceptions: pill-shaped buttons (Flip, Add Cards) use a fully rounded radius (26px, i.e. half their height), and the card editor modal uses a slightly larger 14px to distinguish a floating dialog from the flatter page chrome beneath it.

## Application Across the Four Screens

**Welcome**: centered, minimal layout on `--color-bg`. The hero wordmark anchors the top. When logged out, the screen shows a username/password form in place of the Create/Study buttons -- same minimal, uncluttered layout, just swapping the content below the tagline. A failed login shows an inline error message (in `--color-warning`) above the submit button; the input borders also switch to `--color-warning` only when the failure is a credentials problem (401), not when the server is unreachable, so the two failure modes stay visually distinct. On success, the form is replaced by the two clearly weighted actions -- "Create" as a primary-colored button, "Study" as an accent-colored button -- with generous whitespace around them. This is the calmest screen in the app; it should feel like opening a notebook, not landing on a dashboard.

**Manage Stacks**: stack list rendered as `--color-surface` rows with `--color-border` dividers on the `--color-bg` page background. Search input at the top, filtering the list live. "New Stack" as a primary button. Each row's delete icon uses `--color-warning`, and the confirmation dialog reuses that same warning color on its destructive button so the visual language stays consistent between the row-level and confirmation-level warning. **Confirmed, from Phase 2 routing decisions**: since "Study" now routes into this same screen in a `study`-mode variant (rather than a separate picker screen -- see the roadmap's Phase 2 notes), the empty-list state needs to cover a user with zero stacks at all, not just an empty search result. Empty state: a centered plus icon (reusing the same mark as the "New Stack" button) with an "Add a Stack!" prompt beneath it, in `--color-primary` to match "New Stack"'s button color -- mirroring the Study screen's own empty-stack pattern (centered icon + prompt + accent-colored action) but in the primary hue since stack creation, not studying, is the equivalent single action here. Not yet built; flagged for whenever Manage Stacks itself gets built out.

**Manage Cards**: same list treatment as Manage Stacks, scoped to the open stack (stack name shown as an h2). Card editor uses two multi-line textareas (question, answer) on `--color-surface-tint` backgrounds to visually separate "input" from "chrome," with a monospace toggle available in the editor. Delete-with-confirmation follows the same warning-color pattern as stacks.

**Study**: the tray (left side, toggleable, `--color-surface-tint` background) lists cards in the open stack, with the active card indicated using `--color-accent`. The main card area is the largest, calmest surface in the app -- generous padding, `--color-surface` background, question or answer text centered or left-aligned depending on length. The Flip button is the single primary-colored action on the screen, deliberately not competing with anything else. Switching cards via the tray always returns to the question side, matching the stated interaction model. The empty-stack state replaces the card area with a simple prompt ("This stack has no cards yet") and an accent-colored "Add Cards" action linking to Manage Cards -- calm rather than alarming, since an empty stack isn't an error state.

## Dark Mode Palette

Not implemented in v1, but since every color above is a CSS custom property, switching themes is a matter of swapping the token values below at the theme root rather than touching any component. Backgrounds and surfaces move dark while staying warm (not pure black/gray); text inverts to a warm off-white rather than pure white; the primary, accent, and warning hues are lightened from their light-mode values so they keep sufficient contrast against a dark background instead of looking muddy. Each token below plays the exact same role as its light-mode counterpart -- see the [light palette](#color-palette-light) table above for the specific screens and elements each one touches.

| Token | Swatch + Hex | Usage |
|---|---|---|
| `--color-bg` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#1E1C18;border:1px solid #FFFFFF22;vertical-align:middle;margin-right:6px;"></span>`#1E1C18` | Page background on all four screens, including the space behind the card editor modal before it opens |
| `--color-surface` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#262420;border:1px solid #FFFFFF22;vertical-align:middle;margin-right:6px;"></span>`#262420` | The top navigation bar; stack rows in Manage Stacks; card rows in Manage Cards; the card editor modal panel; the main flashcard surface in Study; search inputs; the username/password fields on Welcome/Login; individual card entries in the Study tray |
| `--color-surface-tint` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#2C2A25;border:1px solid #FFFFFF22;vertical-align:middle;margin-right:6px;"></span>`#2C2A25` | The Question/Answer textareas inside the card editor modal; the Study screen's card tray background |
| `--color-border` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#3D3A33;border:1px solid #FFFFFF22;vertical-align:middle;margin-right:6px;"></span>`#3D3A33` | The 1px outline on every surface above -- nav bar divider, stack/card row outlines, the modal's outline, the Study card's outline, input field outlines, and the tray divider in Study |
| `--color-text-primary` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#EDEAE2;border:1px solid #FFFFFF22;vertical-align:middle;margin-right:6px;"></span>`#EDEAE2` | Screen titles (h1) and stack names (h2); stack/card row primary text; typed values in form fields; the Study screen's question/answer text |
| `--color-text-secondary` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#A8A399;border:1px solid #FFFFFF22;vertical-align:middle;margin-right:6px;"></span>`#A8A399` | Card/stack counts, the "Card X of Y" position indicator; field labels; input placeholder text; row preview lines; the Welcome tagline; the Cancel link in the card editor |
| `--color-primary` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#7C8DC0;border:1px solid #FFFFFF22;vertical-align:middle;margin-right:6px;"></span>`#7C8DC0` | The StudyStack wordmark; the avatar circle; "New Stack"/"New Card" buttons; the card editor's "Save" button; the Study "Flip" button; the Welcome "Create" button; the Login "Log In" button |
| `--color-primary-hover` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#94A3D2;border:1px solid #FFFFFF22;vertical-align:middle;margin-right:6px;"></span>`#94A3D2` | Hover/active state for every button listed under `--color-primary` above |
| `--color-accent` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#7FA08D;border:1px solid #FFFFFF22;vertical-align:middle;margin-right:6px;"></span>`#7FA08D` | The Welcome "Study" button; the empty-stack "Add Cards" button; the active card's row highlight in the Study tray; the monospace-font toggle switch |
| `--color-accent-hover` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#95BBA5;border:1px solid #FFFFFF22;vertical-align:middle;margin-right:6px;"></span>`#95BBA5` | Hover/active state for every button listed under `--color-accent` above, same as the light-mode token |
| `--color-warning` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#D97854;border:1px solid #FFFFFF22;vertical-align:middle;margin-right:6px;"></span>`#D97854` | Delete icons on stack/card rows; the delete-confirmation dialog's destructive button; the Login form's error message and icon; input borders on a credentials-failure login error |
| `--color-warning-hover` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#E8916D;border:1px solid #FFFFFF22;vertical-align:middle;margin-right:6px;"></span>`#E8916D` | Hover/active state for the delete-confirmation dialog's destructive button |
| `--color-focus-ring` | <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#A8B8E8;border:1px solid #FFFFFF22;vertical-align:middle;margin-right:6px;"></span>`#A8B8E8` | Keyboard focus outline on any interactive element site-wide, same as the light-mode token |

## CSS Custom Properties Reference

The block below is the full set of tokens described above, ready to paste into `styles.scss`. Light-mode tokens are the active `:root` values; dark-mode tokens are included for reference under a `[data-theme="dark"]` selector but aren't wired up to a theme toggle yet, since dark mode isn't implemented in v1.

Each property below has a comment underneath it naming the specific elements it drives, so this block is self-contained -- you shouldn't need to jump back up to the usage tables earlier in this doc.

```scss
:root {
  // Color palette (light -- active in v1)
  --color-bg: #F6F4EF;
  // Page background on all four screens, incl. the space behind the
  // card editor modal before it opens

  --color-surface: #FFFFFF;
  // Nav bar; stack rows (Manage Stacks); card rows (Manage Cards); card
  // editor modal panel; main flashcard surface (Study); search inputs;
  // username/password fields (Welcome/Login); card entries in the Study tray

  --color-surface-tint: #FBFAF6;
  // Card editor's Question/Answer textareas; Study screen's card tray background

  --color-border: #E3DFD5;
  // 1px outline on every surface above: nav bar divider, stack/card row
  // outlines, modal outline, Study card outline, input outlines (search,
  // username, password, Q&A textareas), and the tray divider in Study

  --color-text-primary: #2A2924;
  // Screen titles (h1) and stack names (h2); stack/card row primary text;
  // typed form values (username, question, answer); Study question/answer text

  --color-text-secondary: #6B675E;
  // Card/stack counts ("24 cards"); "Card X of Y" indicator; field labels
  // (USERNAME, QUESTION, etc.); placeholder text; row preview lines; the
  // Welcome tagline; the card editor's Cancel link

  --color-primary: #3E4C74;
  // StudyStack wordmark/logo; the avatar circle; "New Stack"/"New Card"
  // buttons; the card editor's Save button; Study's Flip button; Welcome's
  // Create button; Login's Log In button

  --color-primary-hover: #2F3B5C;
  // Hover/active state for every button listed under --color-primary above

  --color-accent: #5E8272;
  // Welcome's Study button; Study's empty-stack Add Cards button; the
  // active card's row highlight in the Study tray; the card editor's
  // monospace-font toggle switch

  --color-accent-hover: #4A665A;
  // Hover/active state for the Study button and Add Cards button above
  // (not the tray highlight or mono toggle -- neither is a button)

  --color-warning: #B15C3E;
  // Delete icons on stack/card rows; the delete-confirmation dialog's
  // destructive button; the Login form's error text/icon; the username/
  // password field borders on a credentials-failure login error specifically

  --color-warning-hover: #96492F;
  // Hover/active state for the delete-confirmation dialog's destructive button

  --color-focus-ring: #7C8FC4;
  // Keyboard focus outline on any interactive element site-wide (buttons,
  // inputs, links, tray items) when reached via Tab

  // Typography -- font families
  --font-family-heading: 'Source Serif 4', Georgia, serif;
  // Screen titles and section headers only

  --font-family-body: 'Inter', sans-serif;
  // All buttons, labels, list items, and form fields

  --font-family-mono: 'JetBrains Mono', monospace;
  // Question/answer content when the Study screen's monospace toggle is on

  // Typography -- type scale
  --font-size-hero: 2.875rem;   // 46px -- Welcome/Login wordmark only
  --line-height-hero: 1.2;

  --font-size-h1: 1.75rem;      // 28px -- screen titles, e.g. "Manage Stacks"
  --line-height-h1: 1.3;

  --font-size-h2: 1.25rem;      // 20px -- stack name in Manage Cards, modal titles
  --line-height-h2: 1.35;

  --font-size-body: 1rem;       // 16px -- default UI text, list items, buttons
  --line-height-body: 1.5;

  --font-size-meta: 0.875rem;   // 14px -- timestamps, counts, secondary labels
  --line-height-meta: 1.4;

  --font-size-label: 0.6875rem; // 11px -- all-caps field labels (USERNAME, QUESTION, etc.)
  --line-height-label: 1.3;

  --font-size-code: 0.95rem;    // 15.2px -- monospace question/answer content
  --line-height-code: 1.55;

  // Spacing (8px base unit)
  --space-1: 0.5rem;   // 8px -- base increment of the spacing scale (padding/gaps)
  --space-2: 1rem;     // 16px -- 2x base unit (padding/gaps)
  --space-3: 1.5rem;   // 24px -- 3x base unit (padding/gaps)
  --space-4: 2rem;     // 32px -- 4x base unit (padding/gaps)

  // Corner radius
  --radius-default: 8px;   // cards, buttons, inputs
  --radius-modal: 14px;    // card editor modal
  --radius-pill: 999px;    // pill buttons (Flip, Add Cards) -- 999px reads as
                            // "fully rounded" at any height, unlike the mockups'
                            // literal 26px which only works at that exact button height
}

// Dark mode -- tokens defined for reference; not wired up to a theme
// toggle in v1. Apply by adding data-theme="dark" to <html> or <body>
// once dark mode is implemented. Every token below drives the exact same
// elements as its light-mode counterpart above -- only the hex value changes.
:root[data-theme='dark'] {
  --color-bg: #1E1C18;              // same elements as light-mode --color-bg
  --color-surface: #262420;         // same elements as light-mode --color-surface
  --color-surface-tint: #2C2A25;    // same elements as light-mode --color-surface-tint
  --color-border: #3D3A33;          // same elements as light-mode --color-border
  --color-text-primary: #EDEAE2;    // same elements as light-mode --color-text-primary
  --color-text-secondary: #A8A399;  // same elements as light-mode --color-text-secondary
  --color-primary: #7C8DC0;         // same elements as light-mode --color-primary
  --color-primary-hover: #94A3D2;   // same elements as light-mode --color-primary-hover
  --color-accent: #7FA08D;          // same elements as light-mode --color-accent
  --color-accent-hover: #95BBA5;    // same elements as light-mode --color-accent-hover
  --color-warning: #D97854;         // same elements as light-mode --color-warning
  --color-warning-hover: #E8916D;   // same elements as light-mode --color-warning-hover
  --color-focus-ring: #A8B8E8;      // same elements as light-mode --color-focus-ring
}

// Monospace / code utility -- ligatures disabled per project convention
.font-mono {
  font-family: var(--font-family-mono);
  font-variant-ligatures: none;
  font-feature-settings: "liga" 0, "calt" 0;
}
```

A couple of deliberate departures from the mockups' literal values, worth noting inline here since this is the block you'll actually paste in:

- `--radius-pill: 999px` instead of the mockups' literal `26px`. Both render identically at the Flip/Add Cards button height, but `999px` stays fully rounded if that button's height ever changes.
- The line-height tokens (`--line-height-*`) weren't broken out as separate custom properties elsewhere in this doc, but each type-scale entry above specifies a line-height, so they're included here as independent properties rather than folded into a shorthand.
- `--color-accent-hover` (`#4A665A` light, `#95BBA5` dark) wasn't in the original palette -- the static mockups don't depict interaction states at all, the same reason `--color-focus-ring` had no mockup to derive from either. Both values were computed by applying the same proportional darkening/lightening used to derive `--color-primary-hover` and `--color-warning-hover` from their base tokens (~20% darker in light mode, ~15-19% lighter in dark mode), so the amount of visual "press" stays consistent across every button regardless of color. Treat these two as a reasonable starting point rather than a pixel-matched value from a mockup, and adjust if they don't look right against the accent base once you see them rendered.

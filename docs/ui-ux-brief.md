# UI/UX Design Brief — A is Impossible

Goal: forget-the-browser native feel. Linear/Notion/Raycast reference, not
generic SaaS. Restraint over decoration.

## Color

- Midnight dark-first: canvas `#090d16`, surface `#0f172a`,
  elevated `#162032`, subtle `#1e293b`. Light theme inverts via tokens.
- Single accent: cyan (`#06b6d4` family). Semantic only: emerald success,
  rose destructive, amber streaks/warnings. No rainbow badges.
- Gradients: flat solid CTAs. Gradient allowed for chart fills, avatar chips,
  one-time cinematic/auth surfaces. Radial triple-hue glows: banned (single
  subtle cyan tint max).
- Glass: modal overlays `blur(4px)` max. Panels are solid surfaces.

## Typography

- UI: Plus Jakarta Sans (400–800). Reading: serif for vignettes/notes.
- Scale: page titles black/tracking-tight; section labels
  `text-xs font-bold uppercase tracking-wider text-secondary`;
  numbers `font-mono font-black`. Numbers that change animate via `CountUp`.
- Copy: no em dashes in headlines, no slogans-as-instruction, every empty
  state ends with one primary action.

## Shape & density

- Radii: controls 12–16px, cards 24px, modals 24–32px. No pill-everything.
- Borders: `border-subtle` default, cyan only for primary/active emphasis.
- Shadows: token shadows; hover deepens shadow, never lifts layout
  (no hover translate anywhere — jitter tell).
- Density: 12-col dashboard rhythm (continue → recent → stats → trends);
  one primary CTA per decision point; secondary actions become ghost links.

## Iconography

- Lucide, 3.5–4px sizes in UI, always paired with text except dock/tab bars.
- Pulse reserved for live status (sync dot, running timer, active session).
  No decorative pulse, bounce, or sparkle-chasing. No emoji glyphs (`✓` etc.).

## Motion (see `src/index.css` motion system)

- Tokens: 140/180/220/300ms; `cubic-bezier(0.16,1,0.3,1)` standard,
  spring `cubic-bezier(0.34,1.25,0.64,1)` for physical indicators only.
- Vocabulary: view-enter (8px rise + stagger cascade ≤225ms), modal
  fade+pop, question slide (14px x), success pop (spring), shimmer
  skeletons, count-ups, sliding nav pill (desktop) + dock marker (mobile).
- Forbidden: hover displacement, press-scale on anchored controls,
  multi-second loops on decoration, layout-animating properties.

## Feedback language

- Banner: tinted surface + icon + bold title + message + action/dismiss.
- Toast: bottom/top fixed, auto-dismiss 3.5–4.5s + manual X, variant color.
- Confirm: shared `ConfirmDialog` (title, consequence copy, danger confirm).
- Celebration: confetti only for earned moments (correct answers with sound
  on, session score ≥80%), plus `animate-success-pop` on the award tile.

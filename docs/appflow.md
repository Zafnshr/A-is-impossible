# Appflow — navigation & journeys

## Shell

`Navbar` (search, theme, timer badge, account) + `Sidebar`
(desktop sliding pill; mobile dock with sliding marker + More sheet).
`activeTab`: dashboard | library | deck_detail | study | collections |
analytics | import | editor | trash | backup | help | settings.
Tab switch remounts `<main>` with `animate-view-enter` cascade.

## First visit (live path)

1. `CinematicIntro` (skippable, 12s) → 2. sandbox `OnboardingContainer`
   (8 steps, fake data) → 3. `WelcomeAuthModal` (Google / Guest) →
   4. Dashboard zero-state → Import/Library → Study → Collections/Analytics.

## Core loops

- **Import → study**: Import wizard (5 steps) → `onCompleteImport` navigates
  to `deck_detail` (wizard success screen is bypassed) → Study Deck →
  Setup modal → session → completion modal (review-incorrect / retry /
  lecture view / dashboard).
- **Cram**: Collections tab → Practice → session with `collectionFilter`.
- **Recover**: Trash → restore; Backup → export JSON/HTML, import + validate.
- **Find**: `Ctrl/⌘K` global search → deck detail / question location.

## Reachability gaps (do not rely on these until fixed)

- `FirstLaunchWelcomeModal`: imported, never rendered (dead).
- `OnboardingWizardModal`: only via legacy `a_plus_first_launch` flag.
- `TourInvitationModal` → `InteractiveTourGuide` (the only real-action
  tour): no live call site sets it open.
- `OnboardingTour.tsx`, `DeckManager.tsx`: unreferenced.
- `HelpCenter` "Replay Guided Tour" relaunches the *sandbox* tour, not the
  interactive one (label now honest; wiring unchanged).

## Modal rules

Overlay fades (`premium-fade-in` 180ms) + panel pops
(`premium-modal-panel-in` 220ms) via global CSS — no per-modal code needed.
Confirmations use shared `ConfirmDialog`. No exit animations (unmount is
instant by design); toasts auto-dismiss with manual X.

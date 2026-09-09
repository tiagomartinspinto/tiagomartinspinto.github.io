# Project Status

## Current State

Static GitHub Pages portfolio for an artistic-research practice. All 16 published projects
render in a single chronological archive; opening a project expands its documentation
inline within the archive rather than in a separate modal. Durable identity and
interaction principles are recorded in `PROJECT_DIRECTION.md`; this file is the current
operational handoff.

## Established Architecture

- **Static, dependency-free.** Vanilla HTML/CSS/JS, no build step, no framework, no
  backend. Deployed directly from `main` via GitHub Pages.
- **Content/data structure.** Project content lives in `data/projects.js`
  (`PROJECTS.length` gives the current count — never hard-code it); site-wide text and
  links live in `data/site.js`. Media lives under `assets/projects/[slug]/`. Layout,
  rendering, and behavior stay code-only in `index.html`, `styles.css`, `script.js`,
  `background.js`.
- **Deep-link format.** `#project=<slug>` opens a project directly; ordinary page anchors
  (e.g. `#top`) are left untouched by the project-hash logic.
- **Inline project-detail model.** A single `#project-inline` region (in
  `index.html`/`script.js`) renders whichever project is open and is repositioned via
  `card.after(...)` to sit immediately after the selected card. Only one project is open
  at a time; opening another closes the previous one. The region is a plain
  `<section>` — no `role="dialog"`, no `aria-modal`, no focus trap — so normal Tab order
  continues through and past it into the rest of the grid. `renderProjectDetail` renders
  media, kicker/title/meta/tags/description/links into it; shared CSS classes are named
  `.project-detail__*` (media, feature, gallery, copy, kicker, caption, image-open,
  larger-label, media-frame).
- **History model.** `openProject`/`dismissProject`/`syncProjectWithLocation` own all
  hash and `history` mutation. Interactive open pushes a new entry; switching directly
  between two open projects replaces the hash in place (no dead middle entry); explicit
  Close consumes a locally-pushed entry with `history.back()` when safe, and otherwise
  silently clears the hash (direct deep links / reloads never navigate off-site).
  `hashchange`/`popstate` reconcile through the same `syncProjectWithLocation` path used
  at initial load.
- **Deep-link focus/orientation.** An interactive open (card/link activated in-page)
  leaves keyboard focus on the trigger. A direct/deep-link open (initial load, or a
  hashchange/popstate with no in-page trigger) focuses the project-detail heading
  (`tabindex="-1"`, not in normal Tab order) and lets the browser's default
  focus-triggered scroll bring the expanded project into view.
- **Relational lenses.** Four category filters (All, Learning, Research, Moving image)
  restyle matching cards (`is-lens-match`) without hiding non-matching projects. Lens
  state persists correctly while a project is open.
- **Lightbox model.** `#image-lightbox` is a separate, genuine `<dialog>` (backdrop,
  `showModal()`, its own Escape/close/backdrop-click handling) for full-size images. It is
  independent of the project-detail region: opening it does not close the open project,
  and Escape closes the lightbox first, the project second.
- **Responsive grid.** Archive grid: 4 columns → 3 at ≤1100px → 2 at ≤760px → 1 at
  ≤520px. Internal project-detail media/text layout is 2-column down to ≤1100px, then
  stacks to 1 column (aligned with the archive's own 3-column breakpoint, not a separate
  760px threshold).

## Established Design/Interaction Decisions

- Projects remain visible as one archive; category lenses reveal relationships without
  removing non-matches.
- Year and category metadata stay visible on cards.
- Project detail expands inline in the archive; it is not a modal, has no backdrop, and
  does not trap focus.
- Only one project detail is open at a time.
- `#project=<slug>` deep links and Back/Forward participate meaningfully in project state.
- Explicit Close/Escape restore appropriate state and focus.
- The image lightbox remains a separate, genuinely modal interaction.
- Current grayscale/colour lens treatment remains.

See `PROJECT_DIRECTION.md` for the full durable rationale.

## Verification Status

Browser-verified (local static server, headless Chrome) after the modal-removal /
class-rename / deep-link-focus / breakpoint cleanup pass:

- All 16 published projects: open, correct detail/hash/`aria-expanded`/selected state,
  media, description, links (present or correctly hidden), Close, focus restoration —
  zero console errors across all 16 open/close cycles.
- Responsive spot checks (PVA, FinnCERES, Chladni Particle Assembly, BQG, Viagem de Volta,
  Prossigo) at 1440/1024/760/600/390px: no overflow, correct stacking at the new
  breakpoint, no regression at any width.
- History: open→Close, open→Back→Forward, direct deep link, reload while deep-linked,
  Escape, switch A→B→Close, switch A→B→Back — all correct, no dead history entries.
- Deep-link focus/orientation verified at index 0 (PVA), a middle project, index 12
  (BQG), and index 15 (Prossigo) at 1440 and 390px: heading focused and visible, no
  top-of-page stranding, no excessive animated scrolling.
- Lens matching/non-matching states verified while a project is open.
- Lightbox: opens independently of the open project; first Escape closes the lightbox,
  second Escape closes the project; focus restoration correct at each step.
- Keyboard: Tab from the detail's Close button flows through its own controls and onward
  into the next project card (confirmed not trapped); keyboard (Enter) interactive open
  leaves focus on the trigger, not the heading.
- `git diff --check`, JS syntax checks, HTML duplicate-ID check, and all 108 local media
  references verified present; no dead `project-dialog` selectors or markup remain.

## Known Limitations / Remaining Work

- None currently tracked.

## Manual Tests Worth Repeating

- Open each of the 16 projects, confirm single inline node + selected card + correct hash
  + `aria-expanded`, then Close.
- Direct deep link to a near-top, middle, and deep project at a desktop and a mobile
  width; confirm the heading is focused and visible without excessive scrolling.
- Open a project, open its image lightbox, Escape twice (lightbox closes, then project),
  confirm focus lands back correctly each time.
- Switch directly between two open projects (A → B), then Close, then separately test
  A → B → Back, confirming no dead history entries either way.
- Resize an open project's detail across 1440 → 1024 → 760 → 390px and confirm no
  horizontal overflow and correct stacking.

## Recent Implementation State

The relational-archive redesign (inline project detail, relational lenses, deep-link/
history model, and the responsive-grid/breakpoint adjustment) is deployed to production
at commit `4e2e24b5268bac6dd05f7782cc22317e11b65f0c`. Local and remote `main` are
synchronized. Production verification at tiagomartinspinto.com found no known blocking
or follow-up defects.

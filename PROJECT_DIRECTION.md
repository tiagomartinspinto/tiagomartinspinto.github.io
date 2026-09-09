# Project Direction

## Role Of This Document

This document records the relatively stable identity and decision-making principles of
the portfolio. It should guide substantial content, design, and technical changes without
freezing the current implementation. Temporary work, unresolved issues, and manual test
needs belong in `PROJECT_STATUS.md`.

## Project Essence

This is Tiago Martins Pinto's public portfolio of artistic research and practice across
art, technology, education, creative coding, participatory work, exhibitions, and moving
image. Its purpose is to let the work speak through a compact, coherent archive: visitors
can scan the breadth of the practice, understand Tiago's role and context in each project,
and move into selected documentation or related sources without the site behaving like a
commercial landing page.

## Primary Audience

The portfolio primarily serves people trying to understand or evaluate the practice:
potential collaborators, curators, educators, researchers, institutional peers, and
students. They may arrive with little context and need to establish quickly:

- what kinds of work Tiago makes and supports;
- how art, research, teaching, and technology relate across the practice;
- what Tiago contributed to a particular project;
- where to find fuller documentation, research records, or course material;
- how to contact Tiago or continue into his professional profiles.

## Core Objects

The primary object is the **project**. A project combines identity and context (title,
year, type, role, categories, and descriptions) with evidence (images or video) and
selected outward links.

Supporting objects are:

- **media items**, which document a project rather than acting as a separate feed;
- **categories**, which provide overlapping views of the practice rather than a rigid
  taxonomy;
- **site information**, which establishes authorship, contact, biography, location, and
  professional links.

## Primary Activities

1. Scan the project collection and understand the range and chronology of the practice.
2. Filter the collection by meaningful areas such as education, participation, research,
   exhibitions, interactive work, and moving image.
3. Open a project to examine its media, context, role, and supporting links.
4. Continue to an external project, publication, course archive, or professional profile,
   or contact Tiago directly.

Deep-linking to an individual project is an important supporting activity. Content
maintenance is an author workflow performed by editing the local data and media files; it
is deliberately not a public or in-browser workflow.

## Design Position

The experience should feel quiet, precise, slightly technical, and personal. The dark
field, restrained green accent, monospace details, compact project grid, and
Processing-like background connect artistic practice with computation without turning
the portfolio into a technology showcase. Project documentation carries the visual
weight. Interface elements should remain secondary, and the rhythm should support both
quick scanning and slower inspection.

The portfolio's distinctiveness comes from the relationship between the project archive,
the overlapping practice categories, the direct project viewer, and the subtle generative
background—not from decorative novelty.

## Product Principles

1. **Present one connected practice.** Art, teaching, research, participation, and
   technology should appear as related parts of the same body of work, not as separate
   personal brands or microsites.
2. **Lead with documented work.** Project imagery, concise descriptions, roles, and dates
   should establish credibility before biography or self-promotion.
3. **Make contribution legible.** Every project should distinguish Tiago's role from the
   wider project context and collaborators without exaggerating either.
4. **Keep the archive selective.** A project and each media item should earn their place.
   More content is not automatically a more complete or useful portfolio.
5. **Support scanning and depth together.** The grid should communicate range quickly;
   the project viewer should provide enough context and media for deliberate inspection.
6. **Treat content as factual record.** Dates, roles, collaborators, institutions, and
   descriptions must come from known project information rather than inferred marketing
   language.
7. **Prefer durable simplicity.** The site should remain easy to host, understand, and
   maintain without services that create operational or privacy burdens.

## Interaction Principles

- The main page remains the orientation surface. Project detail remains part of the
  archive: opening a project expands its documentation inline, in place, rather than
  replacing or obscuring the collection context.
- Only one project's detail is expanded at a time; opening a different project closes the
  previous one. The rest of the archive, including the opened project's own card, stays
  visible and reachable, and normal document reading and Tab order continue through and
  past the expanded detail rather than being captured by it.
- Project cards behave as clear entry points, with imagery and concise descriptions rather
  than hidden gestures or ornamental controls.
- Filters are immediate, overlapping views of the same collection. They do not create
  separate sections, remove access to non-matching projects, or imply that a project
  belongs to only one discipline.
- Project URLs remain shareable through the `#project=<slug>` fragment convention and map
  directly to the expanded project state; ordinary page anchors continue to work
  independently, and browser Back/Forward participate meaningfully in that state.
- The expanded project detail closes predictably through its own close control or Escape
  and restores focus and orientation appropriately; it does not behave as a modal dialog
  and has no backdrop of its own. The image lightbox is a separate, genuinely modal
  interaction: it closes through its close control, Escape, or backdrop click, and
  restores focus in turn.
- Keyboard access, meaningful alternative text, live status announcements, touch targets,
  and reduced-motion behavior are part of the experience, not optional polish.
- Motion stays ambient and low-priority. It may establish atmosphere or gently reveal
  content, but must not delay access, compete with project media, or become necessary for
  comprehension.
- External links are explicit continuations of a project or professional context, not a
  substitute for the portfolio's own essential explanation.

## Technical Principles

- Keep the public site as static, dependency-free HTML, CSS, and JavaScript unless a new
  requirement clearly exceeds that architecture.
- Deploy directly from `main` through GitHub Pages, with no build step, backend, database,
  cloud CMS, analytics, telemetry, or tracking.
- Keep structured content in `data/projects.js` and `data/site.js`; keep layout, rendering,
  and behavior in the site code.
- Keep project media local under `assets/projects/[project-slug]/` when practical, using
  dedicated thumbnails to protect grid performance and full-resolution sources for
  inspection.
- Preserve progressive resilience: useful document metadata and a minimal identity remain
  available without JavaScript, while the interactive project archive is enhanced by the
  module scripts.
- Preserve backwards-compatible project slugs and deep links unless there is a deliberate
  migration plan.
- Favor small, reviewable changes. Because `main` is the production branch, every pushed
  change is a deployment.

## What Should Remain Stable

- The portfolio's identity as an artistic-research archive rather than a generic personal
  marketing site.
- Projects as the central organizing object.
- The restrained dark visual language, compact density, mono accent, and secondary role of
  interface chrome.
- Direct access to roles, dates, descriptions, media, and authoritative external sources.
- Accessibility, reduced-motion support, privacy, and low operational complexity.
- Factual integrity and the absence of invented or embellished project claims.

## What May Evolve

- The selected projects, their order, categories, descriptions, media, and links as the
  practice develops.
- Grid density, responsive details, and media presentation when real content or usability
  evidence justifies a change.
- The background behavior and other atmospheric details, provided they remain subtle,
  accessible, and consistent with the artistic-computational character.
- Data fields and rendering support for new project media or documentation needs, while
  preserving a maintainable static architecture.
- Established visual or interaction patterns after implementation and review demonstrate
  that a different pattern better serves the portfolio.

## Anti-Principles

The portfolio should deliberately avoid:

- generic agency, startup, résumé-template, or dashboard presentation;
- promotional metrics, testimonial sections, conversion funnels, or inflated claims;
- dividing the practice into disconnected brands or forcing projects into one category;
- decorative effects, oversized statements, or interface chrome that compete with the
  work;
- fashionable visual treatments added without a project-specific reason;
- autoplaying or attention-seeking media and motion;
- publishing project details that are plausible but unverified;
- adding accounts, administration interfaces, analytics, databases, or third-party
  services for convenience alone;
- broad rewrites that erase working behavior or established character without a validated
  reason.

## Evolving This Direction

Treat these statements as durable principles, not an immutable specification. Update them
when repeated implementation evidence or explicit project decisions change the direction.
Do not promote a one-off experiment into a rule prematurely. If an established principle
changes, record the new principle and the reason for the change explicitly so that the
portfolio evolves intentionally rather than through gradual drift.

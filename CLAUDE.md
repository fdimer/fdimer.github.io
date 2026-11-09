# fdimer.github.io: projects site

Static GitHub Pages site (plain HTML + `style.css`, no build step) listing all of
fdimer's projects. Live at https://fdimer.github.io.

## Site structure

The projects are split into two groups, each with its own section page:

| Page | What goes there |
|---|---|
| `index.html` | Hub only: one card per group, linking to the two section pages, plus the Publications card. No project cards here. |
| `personal/index.html` | **Personal projects**: hardware and retro-computing work and other hobby tools that are *not* part of the aWkward sn@ail business. |
| `awkward-snail/index.html` | **aWkward sn@ail projects**: apps published under the aWkward sn@ail software label (Microsoft Store apps). |
| `publications/index.html` | **Publications**: the user's research papers, taken from their Google Scholar profile (user `nXwTI4cAAAAJ`), grouped by field. Linked from its own card on `index.html` (the hub's only non-group card). Citation counts are a dated snapshot; when refreshing, update the stats line, the counts and the card's publication count. Google Scholar blocks automated fetching, so read it through the user's browser. |

> **Currently hidden.** At the user's request, the aWkward sn@ail section is
> hidden until the Microsoft Store account is up and running. Its card on
> `index.html` is wrapped in an HTML comment, and `awkward-snail/index.html` plus
> the six aWkward sn@ail project pages carry `<meta name="robots" content="noindex">`.
> The pages still exist and can be updated, but don't link to them from
> `index.html` or the personal pages, and don't un-hide them until the user says so.
> To un-hide: remove the comment wrapper around the card on `index.html` and the
> `robots` meta lines from those seven pages.

Each project keeps its own folder at the site root (for example `z80-bench/`,
`chain-calc/`), with its page at `<folder>/index.html` and any browser version at
`<folder>/app/`. Folders are **not** moved into the section folders, so existing
links keep working.

### Which group a project belongs to

- **aWkward sn@ail:** the project's repo is mirrored to the `AwkwardSnail` GitHub
  organisation (github.com/AwkwardSnail). Currently: SimpleMusic (`music-editor/`),
  SimpleMusic Rhythm (`music-rhythm/`), TextBrowser (`text-browser/`),
  Chain Calc (`chain-calc/`), SimpleLetters (`simple-letters/`),
  SimpleFunLetters (`fun-letters/`).
- **Personal:** the repo exists only under `fdimer`. Currently: Z80 Bench
  (`z80-bench/`), 6502 Bench (`6502-bench/`), Osborne Executive
  (`osborne-executive/`), Sinclair ZX80 (`zx80/`), Font Developer
  (`font-developer/`). Z80 Bench and the emulators built on it are never part of
  aWkward sn@ail.
- If it's unclear which group a new project belongs to, ask the user.

## Adding or updating a project

1. Create or update the project's folder at the root: `<folder>/index.html`
   (copy an existing project page as the template) and optionally `<folder>/app/`.
2. Add a card to the right section page (`personal/index.html` or
   `awkward-snail/index.html`). Card links go up one level: `href="../<folder>/"`.
3. In the project page, point the back links at its section:
   - top: `<a class="back" href="../personal/">&larr; Personal projects</a>`
     or `<a class="back" href="../awkward-snail/">&larr; aWkward sn@ail projects</a>`
   - footer: `<footer><a href="../<section>/">&larr; Back to …</a> · <a href="../">All projects</a></footer>`
4. On `index.html`, update the project count in that group's card tag
   (for example `6 apps`), and the card's one-line summary if the new project
   changes it.
5. aWkward sn@ail projects: also push the project's code to both
   `fdimer/<repo>` and `AwkwardSnail/<repo>` so the mirrors stay identical.

## Related

- The aWkward sn@ail business website is a separate site:
  `AwkwardSnail/awkwardsnail.github.io`, live at https://awkwardsnail.com.au.
  Don't list apps there until the user says so (on hold until the Microsoft
  Store publisher name is fixed).

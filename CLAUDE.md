# fdimer.github.io: projects site

Static GitHub Pages site (plain HTML + `style.css`, no build step) listing all of
fdimer's projects. Live at https://fdimer.github.io.

## Site structure

The projects are split into three groups, each with its own section page:

| Page | What goes there |
|---|---|
| `index.html` | Hub only: one card per group, linking to the three section pages, plus the Publications and Favourite books cards. No project cards here. |
| `emulators/index.html` | **Emulators**: Z80 Bench and every emulator built on it or derived from it (6502 Bench, Osborne Executive, Sinclair ZX80/ZX81, MSX, Commodore PET). |
| `personal/index.html` | **Miscellaneous projects**: the user's other personal hobby tools that are neither emulators nor part of the aWkward sn@ail business. The folder keeps its old name `personal/` so existing links work; its title is "Miscellaneous projects". |
| `awkward-snail/index.html` | **aWkward sn@ail projects**: apps published under the aWkward sn@ail software label (Microsoft Store apps). |
| `publications/index.html` | **Publications**: the user's research papers, taken from their Google Scholar profile (user `nXwTI4cAAAAJ`), grouped by field. Linked from its own card on `index.html`. Citation counts are a dated snapshot; when refreshing, update the stats line, the counts and the card's publication count. Google Scholar blocks automated fetching, so read it through the user's browser. **Never list** "Desenvolvimento de Pacotes de Auto-Aprendizagem e Avaliação no ISUTC" (F Oliveira, CO Smith, CLME'08): Scholar attributes it to the user, but it isn't theirs. Also leave out "Phase transition in the Dicke model: Phase space approach": an internal communication, not a publication. **Keep** the items that aren't on Scholar when refreshing: the 2015 Adelaide earthquake loss scenario paper and the whole "Articles and talks" section (found by web search or supplied by the user, and approved by the user; "Tails of Woe" is Risk Frontiers Newsletter 15(2), Nov 2015). |
| `books/index.html` | **Favourite books**: the user's own list of favourite books, grouped by kind (Science and mathematics, Computers, Fiction, Comics). Linked from its own card on `index.html`; update the card's book count when the list changes. Only list books the user has chosen: don't add guesses from their orders or profile without asking. |

> **Released one app at a time.** The aWkward sn@ail apps are being released
> in the Microsoft Store one per day, and each app appears on the site only from
> its release day. Released so far: **Chain Calc** (free; Store page https://apps.microsoft.com/detail/9NS3M6ZN477C), **Simple Music Melody** (Store page https://apps.microsoft.com/detail/9PGSX2ZGBBPG). The hub card on
> `index.html` and `awkward-snail/index.html` are visible. Unreleased apps
> (SimpleMusic Rhythm, TextBrowser, SimpleLetters, SimpleFunLetters)
> have their cards on `awkward-snail/index.html` wrapped in an `UNRELEASED`
> HTML comment, and their project pages carry `<meta name="robots" content="noindex">`.
> To release an app: remove the comment wrapper around its card, remove the
> `robots` meta line from its project page, change "coming soon to the
> Microsoft Store" on that page to say it's in the Store (add a "Get it from the Microsoft Store"
> button with the Store link, https://apps.microsoft.com/detail/<Store ID>, once the user has it), update the app count and summary on the hub card, and
> add it to the apps list on awkwardsnail.com.au (see Related). Only release an
> app when the user says it's out.

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
- **Emulators:** personal (repo only under `fdimer`) and an emulator. Currently:
  Z80 Bench (`z80-bench/`), 6502 Bench (`6502-bench/`), Osborne Executive
  (`osborne-executive/`), Sinclair ZX80/ZX81 (`zx80/`), MSX Sony HB-55P (`msx/`), Commodore PET 2001-N (`pet/`, built on 6502 Bench, `pet` branch of `fdimer/6502-bench`). Z80 Bench and the
  emulators built on it are never part of aWkward sn@ail.
- **Miscellaneous:** any other personal project (repo only under `fdimer`).
  Currently: Font Developer (`font-developer/`).
- If it's unclear which group a new project belongs to, ask the user.

## Adding or updating a project

1. Create or update the project's folder at the root: `<folder>/index.html`
   (copy an existing project page as the template) and optionally `<folder>/app/`.
2. Add a card to the right section page (`emulators/index.html`,
   `personal/index.html` or `awkward-snail/index.html`). Card links go up one level: `href="../<folder>/"`.
3. In the project page, point the back links at its section:
   - top: `<a class="back" href="../emulators/">&larr; Emulators</a>`,
     `<a class="back" href="../personal/">&larr; Miscellaneous projects</a>`
     or `<a class="back" href="../awkward-snail/">&larr; aWkward sn@ail projects</a>`
   - footer: `<footer><a href="../<section>/">&larr; Back to …</a> · <a href="../">All projects</a></footer>`
4. On `index.html`, update the project count in that group's card tag
   (for example `6 emulators`, `6 apps`), and the card's one-line summary if the new project
   changes it.
5. aWkward sn@ail projects: also push the project's code to both
   `fdimer/<repo>` and `AwkwardSnail/<repo>` so the mirrors stay identical.

## Related

- The aWkward sn@ail business website is a separate site:
  `AwkwardSnail/awkwardsnail.github.io`, live at https://awkwardsnail.com.au.
  Its "apps" section lists each app on its release day (name, price, one-line
  description, and a link to the app's `AwkwardSnail/<repo>` source); keep it
  in step with the released apps here.

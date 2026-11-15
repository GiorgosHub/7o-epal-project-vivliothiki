# Βιβλιοθήκη · 7ο ΕΠΑΛ Λάρισας

A one-page site for the school library of the 7th Vocational High School (ΕΠΑΛ) of Larissa,
built with the "measuring tape" visual language of
[PROJECT 7ο](https://github.com/GiorgosHub/7o-epal-project) — paper/ink palette, tape yellow,
chips, tick-mark headings, glass sticky header and a hazard-stripe footer edge.

There is no build step: plain HTML, CSS and JavaScript.

## Run locally

Any static file server works.

```powershell
# Node (no dependencies)
node --version
npx serve .          # or: python -m http.server 4173
```

Then open <http://localhost:3000> (or whichever port the server prints).

The catalogue is loaded with `fetch()`, so browse the site through a server (as above) rather than
opening `index.html` via `file://` — browsers block local JSON requests from `file://` pages.

## Deploy

The site is a static folder, so it can be dropped onto Vercel, Netlify, GitHub Pages, or any
web space of the school.

- **Vercel** — import the repository, keep *Framework Preset: Other*, build command empty,
  output directory `.` (root). `index.html` is served as the entry point.
- **GitHub Pages** — Settings → Pages → *Deploy from a branch* → `main` / root.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | All content (hero, hours, catalogue, rules, collection, news, contact, terms, footer) |
| `assets/style.css` | Design tokens, layout, light/dark themes, wave background, motion layer, catalogue & terms components, print styles |
| `assets/app.js` | Wave background, theme switch, mobile nav, scroll UI, Athens clock + "open now" status, weekday filter, catalogue search, motion |
| `assets/catalog.json` | Snapshot of the myLib catalogue: 1.922 books (title, author, Dewey, publisher, call number) |
| `tools/sync-catalog.mjs` | Refreshes `assets/catalog.json` from the school's myLib instance |

## How the "open now" status works

The schedule table rows carry the opening slot in minutes:

```html
<tr data-day="1" data-start="545" data-end="590"> … </tr>
```

`data-day` is `0` = Sunday … `6` = Saturday, and `data-start` / `data-end` are minutes after
midnight (`545` = 09:05, `590` = 09:50).

On every 15 s tick `assets/app.js` reads the current time in `Europe/Athens`, highlights today's
rows, marks the running slot and writes one of:

- `Ανοιχτά τώρα · δανεισμός έως HH:MM`
- `Κλειστά τώρα · ανοίγει <ημέρα> στις HH:MM`

If hours change, only the table rows (displayed text + `data-start` / `data-end`) need editing.

## Book catalogue

The whole catalogue lives on the site, so visitors never leave for another tab.

- `assets/catalog.json` is a snapshot of the school library's myLib records — **1.922 books**,
  taken on 15 November 2026. Only bibliographic fields are kept: barcode, title, subtitle,
  author, Dewey class, publisher and call number (no member data, loans or covers).
- The JSON is fetched lazily when the `#katalogos` section approaches the viewport or the search
  field gets focus, so the initial page load stays light.
- `assets/app.js` folds Greek accents and final sigma, so searching `βιβλιο` matches `βιβλίο`,
  and `καζαντζακης` matches `Καζαντζάκης`. Every word must match somewhere in the title, author,
  publisher, call number or Dewey number.
- Dewey chips (000–900 plus "Λοιπά") filter by top-level class. Results render 24 at a time with
  an "Εμφάνιση περισσότερων" button. <kbd>/</kbd> jumps to the search field.
- The catalogue deliberately does **not** show live availability: the snapshot would go stale.
  The page tells visitors to confirm loans with library staff.

To refresh the snapshot (Node 18+, no dependencies):

```powershell
node tools/sync-catalog.mjs           # full refresh, ~30 s (1 request per book)
node tools/sync-catalog.mjs --quick   # titles/authors/Dewey only, 1 request
```

The script talks to the myLib installation of the school
(`https://lib7epal-larisa.mysch.gr`) using the same endpoints as its public catalogue
(`ctrl/processbook.php`, `method=allBooks` and `method=bookview`), with modest concurrency and
retries. It writes the `generated` date into the JSON; update the visible date in the catalogue
section of `index.html` when you refresh it.

## Terms of use

The `#oroi` section (linked from the footer and from the rules/catalogue source lines) contains:

- **Α — Όροι χρήσης της σελίδας**: informational purpose, snapshot not a live loan service,
  educational reuse with attribution, external links, no warranty, no abusive scraping.
- **Β — Συμφωνία χρήστη βιβλιοθήκης**: membership, 14-day loan of one book, responsibility for
  damage/loss, no borrowing with overdue items, in-house-only material, quiet and no food/drink,
  acceptance of the 2026–2027 rules.
- **Γ — Προσωπικά δεδομένα**: no accounts, forms or tracking cookies; theme preference in
  `localStorage`; Google Fonts disclosed as the only third-party request; member records kept by
  the school in myLib/ΠΣΔ; contact for data requests.

The terms are informational and mirror the official school rules; they are not a substitute for
the signed school regulation.

## Background

The default background of [PROJECT 7ο](https://7o-epal-project.vercel.app/) — its **waves** scene —
is reproduced here: three soft SVG bands anchored to the bottom of the viewport, generated in
`assets/app.js` to the viewport size and drifting at 80 s / 58 s / 42 s over a calm paper base with a
tape glow in the top corner. Colours come from the same `--tape` / `--blue` tokens, so the scene
follows the light and dark themes (the dark theme brightens it the same way the original does), and
it is rebuilt on resize and theme change. The waves pause under `prefers-reduced-motion` and are
hidden when printing. They replace the earlier dot-grid layer.

## Motion

The motion layer is hand-written CSS and JavaScript — no animation library, no extra requests.
It follows the pacing of [teleia.](https://teleia01.vercel.app/) while keeping the library's own
"measuring tape" props:

- A short tape-yellow **intro curtain** (once per browser session, skipped for reduced motion) with
  the `7` tile and a filling ruler, then the hero cascades in.
- The hero title is underlined by the same hand-drawn **calligraphic pen line** as PROJECT 7ο: a
  swash with a loop that lifts off at the end, drawn in once after the curtain, sized from the
  title's own text and skipped under reduced motion.
- Section headings **split into words** that rise out of their own line; panels and their cards,
  rules, news items and terms columns arrive with a small stagger.
- **Parallax** on the hero title, shelf and the large faint section numbers. Only `transform` is
  animated; positions are re-measured when the catalogue changes the document height.
- The stats bar **counts up** once it enters the viewport, the active catalogue rows and Dewey chips
  animate in on every search/filter, and the result count pulses.
- **Magnetic** primary buttons, a subtle **3D tilt** on cards, a lagging **cursor ring** on fine
  pointers, a **scroll ruler** with a travelling marker on wide screens, and a **circular theme
  wipe** (View Transitions API where supported).
- `prefers-reduced-motion: reduce` disables the intro, cursor, ruler and all transitions/animations;
  a 3-second failsafe removes the JS-only reveal styles if `assets/app.js` never loads.

## Sources

Content was taken from the official school site, whose HTML pages currently answer with a
WordPress 500 error while the REST API and the PDF uploads still work:

- Library page: `https://7epal-laris.lar.sch.gr/βιβλιοθήκη/` (via
  `/wp-json/wp/v2/pages/5103`)
- Κανονισμός Σχολικής Βιβλιοθήκης 2026–2027 (PDF, `wp-content/uploads/2026/09/…`)
- Ωράριο δανεισμού και λειτουργίας αναγνωστηρίου από 12-10-2026 (PDF,
  `wp-content/uploads/2026/10/…`)
- Στοιχεία Επικοινωνίας page (address, phone, e-mail)
- Posts tagged/mentioning the library: 07-11-2026, 24-06-2026, 20-05-2026, 10-05-2026
- LarissaPress, 25-04-2026 — διήμερη εκδήλωση για την Παγκόσμια Ημέρα Βιβλίου
- myLib catalogue of the library: `https://lib7epal-larisa.mysch.gr/allBooks` (instance found via
  the myLib school-library directory, <https://mylib.gr>)

Only verified facts are shown; no invented book counts or statistics. The figures in the stats
bar (1.922 titles from the catalogue, 14 days, 10 hours/week, 4 staff) are derived from the
catalogue, the schedule and the rules.

## Notes

- Colours, type, and components follow PROJECT 7ο; the library-specific motif is a shelf of
  book spines instead of the measuring tape.
- Light/dark theme follows the system preference and can be toggled; the choice is stored in
  `localStorage`.
- The page respects `prefers-reduced-motion` and has print styles (nav, ticker, decorative
  layers hidden).
- Lighthouse on the local build: Accessibility 100, Best Practices 100, SEO 100.

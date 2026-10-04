# Technical contribution guide

Routine content changes are designed to be made in a browser. Follow [MAINTAINING.md](MAINTAINING.md) for page copy, News, Events, navigation and contact updates. The structures described there must remain editable through GitHub's browser interface without requiring terminal use for normal Association maintenance.

## Public information architecture

The top-level destinations are Home (`/`), About (`/about/`), History (`/history/`), News & Events (`/news-events/`), Get Involved (`/get-involved/`), Support JUSSAA (`/support/`) and Contact (`/contact/`). Labels and destinations live in `_data/navigation.yml` and are rendered in desktop and mobile navigation from that source.

## Layout and page content

`_layouts/default.html` provides the shared document shell, header and footer. `page.html` is the reusable interior layout: it selects the compact branded header and renders the page introduction and content. Ordinary pages use `layout: page`, with `title`, optional `label`, optional `description`, and a stable `permalink`. `label` is the small introduction text above the title. Omit either optional field when it is not needed; no blank placeholder is rendered.

`index.html` is the Home-only page and uses the expandable masthead. Shared pieces live in `_includes/`. Keep ordinary copy in Markdown pages and repeated content in collections rather than adding content to Liquid templates.

## News and Events collections

`_config.yml` explicitly configures the standard Jekyll `_news/` and `_events/` collections with output pages. Each collection item is a Markdown file with a front-matter block between `---` lines. The regular maintainer guide includes complete copyable examples.

News items use `layout: news` and require `title` and `date`. Optional fields are `summary` and `links`. The body is optional. Event items use `layout: event` and require `title` and `date`; optional fields are `summary`, `location` and `links`. Their Markdown body is optional too. Each item gets its own page at `/news/<filename>/` or `/events/<filename>/`.

Both models use the same generic optional `links` list. Each entry has a human-readable `label` and a `url`; links can point to any kind of resource. The whole field may be omitted, set to `[]`, or contain any number of entries. Templates render no links section when the list is absent or empty. If adding an optional field to a model, update every place that displays that model (item layout, collection listing, and any Home preview), and document the field and a copyable example in `MAINTAINING.md` before exposing it as a routine-editing task. Preserve simple field names and values that can be edited in GitHub's browser. Keep the field optional and make omitted values render cleanly.

The News & Events page renders Latest News, Upcoming Events, Past Events and Follow JUSSAA. It handles empty collections with explanatory text. Upcoming and Past are derived at build time by comparing each event's date with the current date; events are not manually moved. Home previews recent News and Upcoming Events and links to the full hub.

## Navigation behavior

The header markup and responsive menu are in `_includes/header.html`; styles, including the native mobile `<details>` menu, are in `styles.css`. Mobile navigation has no JavaScript state. `assets/js/site.js` handles the Home expandable/compact header behavior and footer year only. Keep the menu links data-driven from `_data/navigation.yml`.

## Development and validation

The repository devcontainer is the supported local environment. It provides Ruby, Bundler, Jekyll, Node, Playwright, Chromium and Chromium's system dependencies. Open the repository in VS Code, choose **Dev Containers: Reopen in Container** from the Command Palette, and wait for container setup to finish. Node and Playwright are test-only tooling; the public site remains Jekyll, Liquid, HTML, CSS and small plain JavaScript. Do not install host-native Chrome.

To preview the site manually, run:

```sh
./scripts/serve.sh
```

Open port 4000 from the editor's **Ports** panel or forwarded-port notification to preview. LiveReload is enabled by default; keep port 35729 forwarded too so the browser can receive updates. Both ports are configured in the devcontainer. Stop the server with `Ctrl+C` in its terminal.

The preview launcher explicitly loads a compatibility fix for Jekyll's LiveReload connection handling. GitHub Pages disables local `_plugins`, so a fix placed there would never run. The launcher handles fragmented handshakes and closes invalid clients without stopping the server or other browser connections. Production builds use the ordinary Jekyll command.

In Codespaces, the launcher selects the HTTPS URL for forwarded port 35729 automatically. For another HTTPS preview proxy, set `JEKYLL_LIVERELOAD_URL` to the browser-facing HTTP(S) origin for the LiveReload listener, for example `JEKYLL_LIVERELOAD_URL=https://reload.example.com ./scripts/serve.sh`. The proxy must terminate TLS and forward plain HTTP/WebSocket traffic to port 35729. `JEKYLL_LIVERELOAD_PORT` changes the internal listener port; forward that port if you change it.

For every UI-affecting change, run both checks from the repository root:

```sh
./scripts/check.sh
./scripts/test-ui.sh
```

`./scripts/check.sh` is the static Jekyll build check and fixture-publication guard. `./scripts/test-ui.sh` runs two Playwright Chromium passes: public content with production configuration, then fixture content with the test overlay. Playwright starts and stops each Jekyll server itself, so no separate preview terminal is needed. Both test servers use a temporary `baseurl`.

For preview-server changes, also run `./scripts/test-live-reload.sh`. It starts isolated preview servers using the real launcher, sends malformed traffic and fragmented handshakes, and verifies that Chromium still reloads edited content and accepts new connections. It covers direct HTTP/WS and an HTTPS/WSS proxy that terminates TLS. Fixtures, test certificates and generated sites stay in temporary directories. CI runs this check alongside browser verification.

The real-content pass covers all seven public routes, desktop and mobile navigation, tablet breakpoint visibility, navigation destinations, real collection records when present, loaded shell assets, and browser console/page errors. Fixture coverage checks representative optional News/Event states, deterministic upcoming/past grouping, section spacing, and visual composition. Update or add coverage in `tests/browser/` when changing rendered behavior. Run an individual test file while iterating with `./scripts/test-ui.sh tests/browser/navigation.spec.ts`.

### Color contrast and dark mode

The browser suite checks WCAG AA text color contrast with `@axe-core/playwright` against Home, News & Events, Support and Contact in both light and dark color schemes, and also against fixture Home, News & Events, Support and interior pages. Run the same `./scripts/test-ui.sh` command to execute these checks. Contrast is evaluated on rendered pages; do not silence or broadly disable Axe's `color-contrast` rule. When changing colors, check both schemes and preserve the semantic tokens near the top of `styles.css` (`--color-page`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-heading` and `--color-link`).

Dark mode also has browser checks for page loading, mobile navigation interaction, visible page headings, internal link navigation and horizontal overflow on the representative routes. Browser console errors and uncaught page errors fail the suite. Keep light and dark mode covered when adding visual behavior or changing shared styles.

Approved visual baselines are committed under `tests/browser/__snapshots__/`. Playwright maps each named image directly through `snapshotPathTemplate` (`{testDir}/__snapshots__/{arg}{ext}`), and compares fixture routes against those files. The seven full-page references use 1440 × 900 and 390 × 844 viewports: `home-desktop.png`, `home-mobile.png`, `news-events-desktop.png`, `support-desktop.png`, `support-mobile.png`, `home-dark-desktop.png`, and `support-dark-mobile.png`.

Run visual comparisons with `./scripts/test-ui.sh tests/browser/visual.spec.ts`. The pixel matcher allows up to 0.35% differing pixels for minor antialiasing variation between Linux renderers; larger mismatches remain failures. A mismatch is a review signal and represents a proposed visual change. Generate candidates in the controlled Dev Container or CI environment with the pinned Playwright Chromium version; host browser and font rendering differences can produce noise. Review every named `*-actual.png` and diff in `test-results/fixtures/` against the committed baseline. A maintainer must explicitly approve the candidate image set in the pull request before replacement. After that approval, replace only the reviewed references with `TEST_FIXTURES=1 xvfb-run -a npx playwright test --config playwright.fixture.config.ts tests/browser/visual.spec.ts --update-snapshots`, inspect the resulting image diff, run `./scripts/check.sh` and `./scripts/test-ui.sh` again, and include the baseline changes in the approved pull request. Never use `--update-snapshots` simply to make a failing test pass.

On failure, Playwright keeps a screenshot and trace under `test-results/` and writes an HTML report to `playwright-report/`. Open the report with `npx playwright show-report`; inspect traces with `npx playwright show-trace <trace.zip>`. GitHub Actions uploads these artifacts for 14 days.

### Deterministic visual fixtures

Artificial News, Event and page fixtures live in `tests/fixtures/collections/`; they are clearly separate from the public `_news/`, `_events/` and root pages. `tests/fixtures/config.yml` adds those collections only to the fixture browser server. It reuses the production layouts, includes, CSS, JavaScript, shared shell and News/Event list templates. The ordinary public browser pass always runs against `_config.yml` and real public routes.

Add a fixture when a rendering state needs stable coverage, such as a missing optional field, a long title, or several related links. Add a News entry under `_news/`, an Event entry under `_events/`, or a page-style case under `_pages/`, with a unique title and an inert `https://example.com/` URL. Keep all wording visibly artificial. Event fixture dates use fixed years far in the past or future so their group cannot flip with the calendar. Add browser assertions in `tests/browser/content.spec.ts` when the state needs behavioral coverage.

Routine prose, News and Event changes must not drive screenshot snapshots. Full-page visual tests use only `/visual-home/`, `/visual-news-events/` and `/visual-support/` fixture routes; do not snapshot arbitrary live editorial routes. The normal production build excludes the fixture collection directory, and `./scripts/check.sh` asserts that fixture titles, filenames and routes are absent from `_site`. Never copy fixtures into public content or run `--update-snapshots` to silence a mismatch. Candidate replacement images require human review and explicit approval before committed snapshots change.

GitHub Actions runs static validation and browser verification as separate named steps on pushes and pull requests. Before committing and pushing technical changes, run both commands above, obtain human approval for any intentional baseline update, and ensure the Actions workflow passes. UI behavior must be exercised in a real browser before a UI change is considered complete; a successful Jekyll build alone does not verify browser behavior or appearance.

## Repository map

- `_config.yml`: Jekyll settings and collection configuration.
- `_data/navigation.yml`, `_data/social.yml`: shared navigation and contact destinations.
- `_layouts/`, `_includes/`: shared presentation and Liquid templates.
- `_news/`, `_events/`: routine repeatable content.
- Root Markdown pages: ordinary public page content.
- `styles.css`, `assets/js/`, `assets/`: visual system, browser behavior and static assets.
- `scripts/`: local preview and canonical validation commands.

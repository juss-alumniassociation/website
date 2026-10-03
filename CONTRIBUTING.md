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

Open port 4000 from the editor's **Ports** panel or forwarded-port notification to preview. Stop the server with `Ctrl+C` in its terminal.

For every UI-affecting change, run both checks from the repository root:

```sh
./scripts/check.sh
./scripts/test-ui.sh
```

`./scripts/check.sh` is the static Jekyll build check. `./scripts/test-ui.sh` runs Playwright in Chromium. Playwright starts Jekyll itself using the test configuration, waits for the site, and stops its managed server when the suite ends, so no separate preview terminal is needed. The test build uses a temporary `baseurl` and fixture News and Events collections to exercise generated links and optional collection fields without publishing test fixture content.

The browser suite covers all seven public routes, desktop and mobile navigation, tablet breakpoint visibility, navigation destinations, baseurl-safe internal links, the Shopify destination, collection content/date grouping, loaded shell assets, and browser console/page errors. Update or add coverage in `tests/browser/` when changing rendered behavior. Run an individual test file while iterating with `./scripts/test-ui.sh tests/browser/navigation.spec.ts`.

Candidate visual screenshots are written to `test-results/candidate-visuals/`. Approved baselines live in `tests/browser/visual.spec.ts-snapshots/`. If an intentional visual change requires new baselines, generate candidate images with `./scripts/test-ui.sh tests/browser/visual.spec.ts`, inspect them with a human, and only then copy the approved images into the baseline directory. A missing baseline produces a candidate image and does not silently establish a canonical baseline. Existing approved baselines are compared automatically. Do not update or commit changed baselines without explicit human approval.

On failure, Playwright keeps a screenshot and trace under `test-results/` and writes an HTML report to `playwright-report/`. Open the report with `npx playwright show-report`; inspect traces with `npx playwright show-trace <trace.zip>`. GitHub Actions uploads these artifacts for 14 days.

GitHub Actions runs static validation and browser verification as separate named steps on pushes and pull requests. Before committing and pushing technical changes, run both commands above, obtain human approval for any intentional baseline update, and ensure the Actions workflow passes. UI behavior must be exercised in a real browser before a UI change is considered complete; a successful Jekyll build alone does not verify browser behavior or appearance.

## Repository map

- `_config.yml`: Jekyll settings and collection configuration.
- `_data/navigation.yml`, `_data/social.yml`: shared navigation and contact destinations.
- `_layouts/`, `_includes/`: shared presentation and Liquid templates.
- `_news/`, `_events/`: routine repeatable content.
- Root Markdown pages: ordinary public page content.
- `styles.css`, `assets/js/`, `assets/`: visual system, browser behavior and static assets.
- `scripts/`: local preview and canonical validation commands.

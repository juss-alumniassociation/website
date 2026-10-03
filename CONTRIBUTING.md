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

The repository devcontainer is the supported local environment. Open the repository in VS Code, choose **Dev Containers: Reopen in Container** from the Command Palette, and wait for container setup to finish. From the repository root inside the container run:

```sh
./scripts/serve.sh
```

Open port 4000 from the editor's **Ports** panel or forwarded-port notification to preview. Stop the server with `Ctrl+C` in its terminal.

Run the canonical validation command before submitting technical changes:

```sh
./scripts/check.sh
```

GitHub Actions runs the same script on pushes and pull requests. Do not bypass or replace it.

## Repository map

- `_config.yml`: Jekyll settings and collection configuration.
- `_data/navigation.yml`, `_data/social.yml`: shared navigation and contact destinations.
- `_layouts/`, `_includes/`: shared presentation and Liquid templates.
- `_news/`, `_events/`: routine repeatable content.
- Root Markdown pages: ordinary public page content.
- `styles.css`, `assets/js/`, `assets/`: visual system, browser behavior and static assets.
- `scripts/`: local preview and canonical validation commands.

# Technical contribution guide

This guide covers implementation work such as layouts, styling, JavaScript, Jekyll configuration, and validation. Routine content updates should follow [MAINTAINING.md](MAINTAINING.md).

## Repository architecture

- `index.html` is the homepage-specific content. Its front matter selects the default layout and expandable homepage header.
- `_layouts/` contains page shells. `default.html` provides the shared document shell; `page.html` is a page layout that uses the default shell and selects compact header behavior.
- `_includes/` contains shared pieces used by layouts, including the head, header, and footer.
- `_data/` contains simple YAML intended for routine maintenance, such as navigation in `navigation.yml` and contact/social destinations in `social.yml`.
- `assets/` contains static assets, including the logo images and `assets/js/site.js` for site behavior.
- `styles.css` contains the site's styling.
- `scripts/` contains the canonical local preview and validation commands.
- `_config.yml` contains Jekyll site settings, including the production URL and base URL.

Keep homepage content distinct from shared layout/includes, routine-maintenance data distinct from implementation code, and avoid moving routine edits into Liquid templates.

## Jekyll layout and header behavior

The `default` layout is the shared outer HTML shell. The `page` layout sets `layout: default` and `header_style: compact`. The homepage sets `layout: default` and `header_style: expandable` in `index.html`.

The header include uses that setting for the expandable homepage masthead. Interior pages use compact-only behavior. Preserve this model in this milestone; do not redesign it as part of operational work.

## Development environment

The repository's devcontainer is the preferred and canonical environment. It is intended to reduce platform differences across macOS, Windows, and Linux.

You generally need Git, Docker, VS Code or another devcontainer-capable editor, and Dev Containers support in that editor. For a first setup, clone `https://github.com/juss-alumniassociation/website.git` with Git, then open the cloned `website` folder in your editor. In VS Code, install the **Dev Containers** extension if needed, open the Command Palette, and choose **Dev Containers: Reopen in Container**. For another editor, use its equivalent command to open the project in its configured devcontainer. Wait for setup to finish before running commands. The devcontainer runs `bundle install` after creation and forwards port 4000.

Native Jekyll setup can work for experienced contributors, but it is an optional expert workflow and is not the supported baseline. Jekyll is the site generator; Liquid is the template language used by the layouts and includes. Front matter is the small YAML settings block at the top of a page such as `index.html`.

## Local preview

From the repository root in the devcontainer, run:

```sh
./scripts/serve.sh
```

Jekyll starts a local server on port 4000. The forwarded port should open in a browser; otherwise open the forwarded port shown by your editor. Stop the server with `Ctrl+C` in its terminal.

## Local validation

Run the canonical validation command from the repository root:

```sh
./scripts/check.sh
```

It builds the site with strict front matter checking. Use this command locally and in CI so both environments perform the same repository validation.

## Branches and pull requests

For technical implementation changes, create a branch for the work, make focused changes, run `./scripts/check.sh`, and open a pull request for review. Keep the pull request scoped to one change and describe what changed and how you validated it. This development workflow is not required for routine browser-only content maintenance.

## Production URL assumptions

`_config.yml` sets `url: "https://jussaa.org"` and `baseurl: ""`. Authored site structure and links should work at the domain root and should not assume the site lives under `/website/`.

## Maintainability rules

- Put routine editable content in obvious content or data files.
- Routine maintainers should not need to edit Liquid templates.
- Give each fact one obvious editing location where practical; do not scatter the same URL or value across templates.
- Keep social/contact destinations in their appropriate `_data/` file rather than copying them into multiple HTML includes.
- Prefer standard Jekyll, Liquid, simple YAML, simple Markdown, plain HTML/CSS/JavaScript, and repository-local code.
- Avoid custom Ruby plugins, unnecessary dependencies or JavaScript frameworks, Jekyll theme gems, content-management abstractions that normal maintainers cannot understand, and build-time magic.
- Do not package this site's shell as a Jekyll theme.
- Future features should preserve browser-only routine maintenance where practical.

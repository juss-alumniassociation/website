# Maintaining website content

This guide is for routine Association updates in a web browser. You need a GitHub account with permission to edit the repository, but do not need Git, a terminal, YAML experience, or a local Jekyll installation.

## Make and save an edit

1. Open the [JUSSAA website repository](https://github.com/juss-alumniassociation/website).
2. Find the file named in the task below. GitHub's file search (`t`) can help.
3. Open it and choose the pencil **Edit** control.
4. Make the content change described below. For Markdown pages, write ordinary text under the settings block. The lines between the two `---` markers contain settings; change their values, but leave field names and indentation intact.
5. Choose **Commit changes** and follow GitHub's on-screen options. GitHub may save to a branch and offer a pull request; the change is not live just because it was saved. After saving, open the repository's **Actions** tab and wait for the validation check to finish. It can take a few minutes. If GitHub's save options or check result are unclear, contact the technical maintainer.

## Add a News item

1. Choose **Add file** → **Create new file**. In the filename box, enter `_news/alumni-achievement.md` (use lowercase words and hyphens). GitHub creates the folder path as it saves the new file.
3. Paste this at the top and replace the example values:

```yaml
---
layout: news
title: Alumni achievement
date: 2026-10-03
summary: A short description of the update.
---
```

4. Add an optional longer story below the second `---`. If the update is only a short listing, leave the body empty.
5. Commit the new file. News appears in the News & Events page and the newest items appear on Home.

## Edit or remove News

Open the item's `.md` file inside `_news`, choose the pencil, edit the title/date/summary/body, and commit. To remove an item, open its file and use GitHub's delete-file control, then commit. Ask the technical maintainer if you are unsure which item to remove.

## Add or edit an Event

1. Choose **Add file** → **Create new file**. In the filename box, enter `_events/fireworks-night.md` (use lowercase words and hyphens). GitHub creates the folder path as it saves the new file.
2. Start with this settings block, replacing the sample details:

```yaml
---
layout: event
title: Fireworks Night
date: 2026-11-06
summary: Join us at the school birthday celebrations.
location: The Junior & Senior School
links:
  - label: Facebook
    url: https://example.com/event
  - label: Registration
    url: https://example.com/register
---
```

3. The summary, location, links, and story below the settings block are optional. The title and date are required. Use a full date as `YYYY-MM-DD`.
4. Commit the file. To edit an event, edit the values in its existing `_events` file and commit.

Upcoming and past sections are calculated from the event date when the site is built. An event dated today or later appears under Upcoming; an earlier date appears under Past. You do not move the file between folders.

### Related links are optional

A `links:` block can contain any number of label and URL pairs, including links to any website or social platform. It can contain one link, several links, or none. Missing `links:` is valid. You may remove the entire block if there are no related links, or keep it empty as `links: []`. Do not remove the indentation from the nested `label` and `url` lines when editing a list.

For example, add another pair with the same indentation:

```yaml
links:
  - label: Facebook
    url: https://example.com/event
  - label: School event page
    url: https://example.com/school-event
  - label: Photos
    url: https://example.com/photos
```

To remove all links, delete the `links:` line and all of its indented entries. The event remains valid.

## Edit ordinary page copy

Open `about.md`, `history.md`, `get-involved.md`, `support.md`, or `contact.md` in the repository root. Edit the ordinary text below the settings block. Do not change the `layout`, `title`, or `permalink` settings unless the technical maintainer asks you to.

## Change navigation

Open `_data/navigation.yml`. Change the text after `title:` to change a displayed label, or the path after `url:` to change its destination. Keep the six list entries, their indentation, and their `title` and `url` field names. Use the existing format, such as `/history/`.

## Update contact or social information

Open `_data/social.yml` and change only the value after the relevant name, such as `instagram:`. Keep the key and punctuation. Contact details are shared by pages, so do not copy these URLs into page files.

## Files not normally edited for routine content

Leave these to the technical maintainer: `_layouts/`, `_includes/`, `assets/`, `styles.css`, `_config.yml`, `Gemfile`, `Gemfile.lock`, `.devcontainer/`, `.github/`, and `scripts/`. Routine content belongs in page Markdown files, `_news/`, `_events/`, or the two `_data/` files described above.

If a GitHub validation check fails after your edit, open the check's message and contact the technical maintainer instead of making random extra edits. If you need to undo a saved change, use the file's GitHub **History** and **Revert** action where available.

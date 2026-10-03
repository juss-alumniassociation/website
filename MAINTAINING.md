# Maintaining website content

This guide is for routine Association updates using a web browser. You do not need to learn Git or use a terminal.

## What you need

You need only:

- a web browser;
- a GitHub account with permission to edit this repository.

Routine maintenance does not require Git installed locally, Ruby, Jekyll, Docker, VS Code, or command-line tools.

## Make a simple edit

1. Open the [JUSSAA website repository](https://github.com/juss-alumniassociation/website).
2. Find and open the file you need. You can use the file list, or press `t` on the repository page to search filenames.
3. Click the pencil-shaped **Edit** control. If GitHub offers **Edit in place** or asks you to create a branch, follow its on-screen choice; the wording can vary with your access.
4. Make the small change. For homepage wording, edit only the words between the existing HTML tags; do not change the tags. For a data file, change only the relevant value and preserve the surrounding indentation and punctuation.
5. A preview is not currently useful for the homepage HTML or YAML data files, so skip it for these edits. If GitHub offers a preview for a Markdown file in the future, it can help check how that text will look.
6. Click **Commit changes**. If GitHub asks where to save, follow its suggested option. It may save directly or offer to create a review page called a pull request; if the choices are unclear, stop and contact the technical maintainer.
7. GitHub calls saving a change a *commit*. For routine website maintenance, you only need to know that this records your edit in the repository.
8. GitHub will run the website validation check for the saved change. The check reports whether the site can be built; it does not publish the site as part of this milestone.

## What you can currently edit safely

These are the routine content and data locations that exist today:

- `index.html` contains the homepage wording. Edit only the text you are confident about; its surrounding HTML controls how it is displayed.
- `_data/social.yml` contains the shared email address and social/contact destinations. Open the file, change only the value you need, and preserve indentation. Do not delete a key such as `email` or `facebook`; the website uses these names to find the values.
- `_data/navigation.yml` contains the current homepage navigation labels and links. A simple existing label or link can be changed here. Keep each item's `title` and `url`, preserve indentation, and do not restructure the list casually. Expanded navigation is planned for a later milestone.

News, events, and other content collections do not exist yet. Instructions for them will be added when those features are introduced.

## Files you should not normally edit

These files and folders control how the website is built or displayed. Leave them to the technical maintainer unless you have been asked to work on the implementation:

- `_layouts/` and `_includes/`
- `assets/js/`
- `styles.css`
- `_config.yml`
- `Gemfile` and `Gemfile.lock`
- `.devcontainer/`
- `.github/`
- `scripts/`

## What if a GitHub check fails?

Your edit has been saved in GitHub, but GitHub could not successfully validate/build the website. Open the failed check and read its message. Do not make random extra edits to try to fix it. If the cause is not clear, undo your change or contact the person currently responsible for technical maintenance. A failed check does not, by itself, tell you what is happening with the live website.

## Undo a mistake

If you have not saved yet, leave the edit screen without committing. If you already clicked **Commit changes**, open the affected file on GitHub and choose **History** to find the saved change. Open that change and use GitHub's **Revert** option if it is available. If GitHub does not offer Revert, or you are unsure which change to undo, stop and contact the technical maintainer rather than editing more files.

## If you are unsure

If you are unsure, do not guess. Contact the person currently responsible for technical maintenance of the website.

#!/usr/bin/env bash
set -euo pipefail

serve_args=(--host "${JEKYLL_HOST:-0.0.0.0}" --port "${JEKYLL_PORT:-4000}")

if [[ -n "${JEKYLL_CONFIG:-}" ]]; then
  serve_args+=(--config "$JEKYLL_CONFIG")
fi

if [[ -n "${JEKYLL_BASEURL:-}" ]]; then
  serve_args+=(--baseurl "$JEKYLL_BASEURL")
fi

if [[ "${JEKYLL_LIVERELOAD:-1}" == "1" ]]; then
  serve_args+=(--livereload --livereload-port "${JEKYLL_LIVERELOAD_PORT:-35729}")
fi

exec bundle exec ruby "$(dirname "${BASH_SOURCE[0]}")/serve.rb" serve "${serve_args[@]}"

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
  serve_args+=(--livereload)
fi

bundle exec jekyll serve "${serve_args[@]}"

#!/usr/bin/env bash
set -euo pipefail

bundle exec jekyll build --strict_front_matter
ruby scripts/check-fixture-publication.rb

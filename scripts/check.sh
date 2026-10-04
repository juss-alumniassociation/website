#!/usr/bin/env bash
set -euo pipefail

ruby scripts/check-content.rb
ruby tests/content-contract.test.rb
bundle exec jekyll build --strict_front_matter
ruby scripts/check-fixture-publication.rb
ruby scripts/check-site.rb
ruby tests/site-integrity.test.rb

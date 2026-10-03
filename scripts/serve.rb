# frozen_string_literal: true

require_relative "live_reload"

# Run the usual CLI with the LiveReload fix already installed, independently of
# GitHub Pages' plugin policy and the source/config directory used by the caller.
load Gem.bin_path("jekyll", "jekyll")

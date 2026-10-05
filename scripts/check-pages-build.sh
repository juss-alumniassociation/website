#!/usr/bin/env bash
set -euo pipefail

pages_url="${PAGES_URL:-https://juss-alumniassociation.github.io/website/}"
base_path="${PAGES_BASE_PATH:-/website}"
runtime_config="$(mktemp "${TMPDIR:-/tmp}/jussaa-pages-config.XXXXXX.yml")"
production_dir="$(mktemp -d "${TMPDIR:-/tmp}/jussaa-production-build.XXXXXX")"
trap 'rm -f "$runtime_config"; rm -rf "$production_dir"' EXIT

PAGES_URL="$pages_url" PAGES_BASE_PATH="$base_path" RUNTIME_CONFIG="$runtime_config" ruby <<'RUBY'
require 'uri'

page_url = ENV.fetch('PAGES_URL')
base_path = ENV.fetch('PAGES_BASE_PATH')
uri = URI(page_url)
raise "PAGES_URL must be an absolute URL: #{page_url}" unless uri.is_a?(URI::HTTPS) && uri.host
raise "PAGES_BASE_PATH must start with /: #{base_path}" unless base_path.start_with?('/')

origin = "#{uri.scheme}://#{uri.host}"
origin += ":#{uri.port}" unless uri.port == 443
expected_path = base_path == '/' ? '' : base_path
raise "PAGES_URL path #{uri.path.inspect} does not match base path #{expected_path.inspect}" unless uri.path.sub(%r{/$}, '') == expected_path

File.write(ENV.fetch('RUNTIME_CONFIG'), <<~YAML)
  url: #{origin.inspect}
  baseurl: #{base_path.inspect}
  production_url: #{page_url.sub(%r{/$}, '').inspect}
YAML
RUBY

bundle exec jekyll build --strict_front_matter --baseurl "$base_path" \
  --config "_config.yml,_config.demo.yml,$runtime_config"

ruby - "$pages_url" "$base_path" <<'RUBY'
require 'uri'

pages_url = ARGV.fetch(0).sub(%r{/$}, '')
base_path = ARGV.fetch(1)
site_dir = File.expand_path('_site', Dir.pwd)
expected_pages = %w[/ /about/ /history/ /news-events/ /get-involved/ /support/ /contact/]
expected_pages.each do |route|
  file = File.join(site_dir, route == '/' ? 'index.html' : "#{route.delete_prefix('/')}index.html")
  raise "missing generated route #{route} (#{file})" unless File.file?(file)
  html = File.read(file)
  canonical = "#{pages_url}#{route}"
  raise "#{route} has wrong canonical URL" unless html.include?(%(<link rel="canonical" href="#{canonical}">))
  raise "#{route} has wrong og:url" unless html.include?(%(<meta property="og:url" content="#{canonical}">))
  raise "#{route} is missing demo noindex" unless html.include?('<meta name="robots" content="noindex">')
end

home = File.read(File.join(site_dir, 'index.html'))
raise 'project base path missing from stylesheet URL' unless home.include?(%(href="#{base_path}/styles.css"))
raise 'project base path missing from logo URL' unless home.include?(%(<img class="brand-logo brand-logo--expanded" src="#{base_path}/assets/logo_white_transparent.png"))
raise 'project base path missing from navigation URL' unless home.include?(%(href="#{base_path}/about/"))

sitemap = File.read(File.join(site_dir, 'sitemap.xml'))
raise 'sitemap is missing demo project home URL' unless sitemap.include?("<loc>#{pages_url}/</loc>")
raise 'sitemap is missing demo project About URL' unless sitemap.include?("<loc>#{pages_url}/about/</loc>")
raise 'sitemap contains the production domain' if sitemap.include?('jussaa.org')
robots = File.read(File.join(site_dir, 'robots.txt'))
raise 'robots.txt has wrong sitemap URL' unless robots.include?("Sitemap: #{pages_url}/sitemap.xml")

puts 'GitHub Pages demo build verified: routes, base path, canonical/OG URLs, sitemap, robots and noindex.'
RUBY

bundle exec jekyll build --strict_front_matter --destination "$production_dir"
ruby - "$production_dir" <<'RUBY'
production_dir = ARGV.fetch(0)
home = File.read(File.join(production_dir, 'index.html'))
about = File.read(File.join(production_dir, 'about/index.html'))
raise 'production canonical URL changed' unless about.include?('<link rel="canonical" href="https://jussaa.org/about/">')
raise 'production gained site-wide noindex' if home.include?('<meta name="robots" content="noindex">')
puts 'Production metadata isolation verified: jussaa.org canonical and no site-wide noindex.'
RUBY

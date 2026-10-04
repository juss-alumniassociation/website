# frozen_string_literal: true

require "yaml"
require "date"

site = File.expand_path("../_site", __dir__)
fixtures = Dir.glob(File.expand_path("../tests/fixtures/collections/**/*.{md,markdown}", __dir__))
failures = []

fixtures.each do |path|
  source = File.read(path)
  match = source.match(/\A---\s*\n(.*?)\n---\s*(?:\n|\z)/m)
  metadata = match ? YAML.safe_load(match[1], permitted_classes: [Date, Time], aliases: true) : {}
  title = metadata && metadata["title"]
  # The fixture hub intentionally shares its production title; its test-only
  # permalink is checked below, while unique artificial titles are checked here.
  failures << "fixture title was published: #{title}" if title && title != "News & Events" && Dir.glob(File.join(site, "**", "*.html")).any? { |html| File.read(html).include?(title) }
  name = File.basename(path, File.extname(path))
  failures << "fixture file name was published: #{name}" if Dir.glob(File.join(site, "**", "*"), File::FNM_DOTMATCH).any? { |output| File.file?(output) && output.split(File::SEPARATOR).include?(name) }
  collection = File.basename(File.dirname(path)).delete_prefix("_")
  %w[.html /index.html].each do |suffix|
    route_file = File.join(site, collection, name + suffix)
    failures << "fixture collection route was published: #{collection}/#{name}" if File.file?(route_file)
  end
end

%w[visual-home visual-support visual-interior visual-news-events].each do |route|
  route_files = [File.join(site, route, "index.html"), File.join(site, "#{route}.html")]
  failures << "fixture route was published: #{route}" if route_files.any? { |path| File.file?(path) }
end

abort failures.join("\n") unless failures.empty?
puts "Production build contains no fixture titles, files or routes."

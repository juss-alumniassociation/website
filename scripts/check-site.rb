# frozen_string_literal: true

require "uri"
require "cgi"
require "rexml/document"

ROOT = File.expand_path("..", __dir__)
SITE = File.expand_path(ENV.fetch("SITE_ROOT", File.expand_path("../_site", __dir__)))
FIXTURE_MARKERS = %w[visual-home visual-interior visual-news-events visual-support long-summary-one-link upcoming-many-links].freeze
errors = []
html_files = Dir.glob(File.join(SITE, "**", "*.html"))
asset_files = Dir.glob(File.join(SITE, "**", "*.css"))

def output_for_path(path)
  clean = path.sub(%r{\A/}, "").split("?").first || ""
  return File.join(SITE, clean, "index.html") if clean.empty? || clean.end_with?("/")

  candidate = File.join(SITE, clean)
  return candidate if File.file?(candidate)
  return File.join(SITE, "#{clean}.html") if File.file?("#{candidate}.html")

  File.join(SITE, clean, "index.html")
end

asset_files.each do |source|
  File.read(source).scan(/url\(\s*(["']?)(.*?)\1\s*\)/i).each do |_quote, raw|
    value = raw.strip
    next if value.empty? || value.start_with?("#", "data:", "//")

    uri = URI.parse(value) rescue nil
    next if uri&.scheme || uri&.host
    target = File.expand_path(uri&.path.to_s, File.dirname(source))
    errors << "#{source.delete_prefix("#{SITE}/")}: broken internal asset reference #{value}" unless target.start_with?(SITE) && File.file?(target)
  end
end

html_files.each do |source|
  text = File.read(source)
  rel = source.delete_prefix("#{SITE}/")
  FIXTURE_MARKERS.each { |marker| errors << "fixture content leaked into #{rel}: #{marker}" if text.include?(marker) }
  text.scan(/\b(?:href|src|action|poster)\s*=\s*(["'])(.*?)\1/im).each do |_quote, raw|
    value = CGI.unescapeHTML(raw.strip)
    next if value.empty? || value.start_with?("//")

    uri = URI.parse(value) rescue nil
    next if uri&.scheme || uri&.host
    path = uri&.path.to_s
    if path.empty?
      next unless uri&.fragment

      target = source
    else
      path = path.sub(%r{\A/preview(?=/|\z)}, "")
      target = path.start_with?("/") ? output_for_path(path) : File.expand_path(path, File.dirname(source))
    end
    unless target.start_with?(SITE) && File.file?(target)
      errors << "#{rel}: broken internal reference #{value}"
      next
    end
    if uri&.fragment && !uri.fragment.empty? && target.end_with?(".html")
      fragment = CGI.unescapeHTML(uri.fragment)
      target_html = File.read(target)
      ids = target_html.scan(/\bid\s*=\s*(["'])(.*?)\1/im).map(&:last)
      names = target_html.scan(/\bname\s*=\s*(["'])(.*?)\1/im).map(&:last)
      errors << "#{rel}: missing fragment ##{fragment} in #{value}" unless (ids + names).include?(fragment)
    end
  end
end

FIXTURE_MARKERS.each do |marker|
  errors << "fixture route leaked into production output: #{marker}" if Dir.glob(File.join(SITE, "**", "*#{marker}*")).any?
end

robots_path = File.join(SITE, "robots.txt")
sitemap_path = File.join(SITE, "sitemap.xml")
errors << "robots.txt was not generated" unless File.file?(robots_path)
errors << "sitemap.xml was not generated" unless File.file?(sitemap_path)
if File.file?(robots_path)
  robots = File.read(robots_path)
  errors << "robots.txt must allow public crawling" unless robots.match?(/^User-agent: \*\s+Allow: \/$/)
  errors << "robots.txt must point to https://jussaa.org/sitemap.xml" unless robots.include?("Sitemap: https://jussaa.org/sitemap.xml")
end
if File.file?(sitemap_path)
  begin
    xml = REXML::Document.new(File.read(sitemap_path))
    locations = REXML::XPath.match(xml, "//*[local-name()='loc']").map(&:text)
    errors << "sitemap.xml is empty" if locations.empty?
    locations.each { |url| errors << "sitemap URL is not an absolute production URL: #{url}" unless url&.start_with?("https://jussaa.org/") }
    %w[/ /about/ /history/ /news-events/ /get-involved/ /support/ /contact/].each do |route|
      errors << "sitemap.xml is missing public route #{route}" unless locations.include?("https://jussaa.org#{route}")
    end
    errors << "sitemap.xml includes 404 page" if locations.any? { |url| url.end_with?("/404.html") }
    FIXTURE_MARKERS.each { |marker| errors << "fixture route appears in sitemap.xml: #{marker}" if locations.any? { |url| url.include?(marker) } }
    errors << "sitemap.xml contains a development host" if locations.any? { |url| url.match?(/localhost|workspaces|github\.io|preview/) }
  rescue REXML::ParseException => error
    errors << "sitemap.xml is not valid XML: #{error.message}"
  end
end

abort errors.uniq.join("\n") unless errors.empty?
puts "Generated site internal references and fixture isolation are valid."

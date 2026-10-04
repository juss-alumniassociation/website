#!/usr/bin/env ruby
# frozen_string_literal: true

require "yaml"
require "date"
require "uri"

ROOT = File.expand_path(ENV.fetch("CONTENT_ROOT", File.expand_path("..", __dir__)))
ERRORS = []

def front_matter(path)
  source = File.read(path)
  match = source.match(/\A---\s*\n(.*?)\n---\s*(?:\n|\z)/m)
  raise "front matter is missing or not closed by ---" unless match

  YAML.safe_load(match[1], permitted_classes: [Date, Time], aliases: false) || {}
rescue Psych::Exception => error
  raise "front matter YAML is invalid: #{error.message.lines.first.strip}"
end

def nonempty_string?(value)
  value.is_a?(String) && !value.strip.empty?
end

def errors_for(path, collection)
  errors = []
  data = front_matter(path)
  unless data.is_a?(Hash)
    return ["front matter must be a set of name/value fields"]
  end

  %w[title date].each { |field| errors << "#{field} is required" unless data.key?(field) }
  errors << "title must be a non-empty text value" if data.key?("title") && !nonempty_string?(data["title"])
  if data.key?("date")
    value = data["date"]
    valid_date = value.is_a?(Date) || (value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}\z/) && (Date.iso8601(value) rescue false))
    unless valid_date
      errors << "date must use YYYY-MM-DD and be a valid calendar date"
    end
  end
  %w[summary location].each do |field|
    next unless data.key?(field) && (field == "summary" || collection == "events")

    errors << "#{field} must be a text value" unless data[field].is_a?(String)
  end
  if data.key?("links")
    links = data["links"]
    if !links.is_a?(Array)
      errors << "links must be a list"
    else
      links.each_with_index do |link, index|
        prefix = "links[#{index}]"
        unless link.is_a?(Hash)
          errors << "#{prefix} must be an object with label and url"
          next
        end
        errors << "#{prefix}.label is required and must not be empty" unless nonempty_string?(link["label"])
        url = link["url"]
        if !nonempty_string?(url)
          errors << "#{prefix}.url is required and must not be empty"
        else
          begin
            parsed_url = URI.parse(url.strip)
            scheme = parsed_url.scheme&.downcase
            if !%w[http https mailto].include?(scheme)
              errors << "#{prefix}.url uses unsupported scheme"
            elsif %w[http https].include?(scheme) && parsed_url.host.to_s.empty?
              errors << "#{prefix}.url must include a website host"
            elsif scheme == "mailto" && parsed_url.opaque.to_s.empty?
              errors << "#{prefix}.url must include an email address"
            end
          rescue URI::InvalidURIError
            errors << "#{prefix}.url must be a valid http, https, or mailto URL"
          end
        end
      end
    end
  end
  errors
end

routes = {}
%w[news events].each do |collection|
  dir = File.join(ROOT, "_#{collection}")
  Dir.glob(File.join(dir, "**", "*.{md,markdown}" )).sort.each do |path|
    next if File.basename(path).start_with?(".") || File.basename(path) == ".gitkeep"

    rel = path.delete_prefix("#{ROOT}/")
    begin
      data = front_matter(path)
      errors = errors_for(path, collection)
      if data.is_a?(Hash)
        basename = File.basename(path).sub(/\.(md|markdown)\z/, "")
        effective = if nonempty_string?(data["permalink"])
                      data["permalink"]
                    else
                      slug = nonempty_string?(data["slug"]) ? data["slug"] : basename
                      "/#{collection}/#{slug}/"
                    end
        if routes.key?(effective)
          ERRORS << "#{rel}: output path #{effective} conflicts with #{routes[effective]}"
        else
          routes[effective] = rel
        end
      end
      errors.each { |message| ERRORS << "#{rel}: #{message}" }
    rescue StandardError => error
      ERRORS << "#{rel}: #{error.message}"
    end
  end
end

abort ERRORS.join("\n") unless ERRORS.empty?
puts "News and Event content contracts are valid."

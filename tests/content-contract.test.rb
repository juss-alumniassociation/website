# frozen_string_literal: true

require "minitest/autorun"
require "tmpdir"
require "fileutils"
require "open3"

SCRIPT = File.expand_path("../scripts/check-content.rb", __dir__)

class ContentContractTest < Minitest::Test
  def run_validator(files)
    Dir.mktmpdir do |root|
      %w[news events].each { |name| FileUtils.mkdir_p(File.join(root, "_#{name}")) }
      files.each { |name, contents| File.write(File.join(root, name), contents) }
      Open3.capture3({ "CONTENT_ROOT" => root }, "ruby", SCRIPT)
    end
  end

  def test_accepts_valid_news_event_optional_fields_and_multiple_links
    out, err, status = run_validator(
      "_news/good.md" => "---\ntitle: Update\ndate: 2026-10-04\nlinks:\n  - label: Web\n    url: https://example.com\n  - label: Email\n    url: mailto:info@example.com\n---\nText",
      "_events/good-event.md" => "---\ntitle: Gathering\ndate: 2026-11-01\nsummary: Hello\nlocation: School\nlinks: []\n---\n"
    )
    assert status.success?, "#{out}#{err}"
  end

  def test_optional_fields_can_be_omitted
    _out, _err, status = run_validator(
      "_news/plain.md" => "---\ntitle: Update\ndate: 2026-10-04\n---\n",
      "_events/plain.md" => "---\ntitle: Gathering\ndate: 2026-11-01\n---\n"
    )
    assert status.success?
  end

  def test_reports_representative_contract_failures_by_filename
    out, _err, status = run_validator(
      "_news/missing.md" => "---\ndate: 2026-10-04\n---\n",
      "_news/bad-date.md" => "---\ntitle: Bad\ndate: 2026-02-30\n---\n",
      "_events/not-list.md" => "---\ntitle: Event\ndate: 2026-10-04\nlinks:\n  label: Facebook\n  url: https://example.com\n---\n",
      "_events/no-label.md" => "---\ntitle: Event\ndate: 2026-10-04\nlinks:\n  - url: https://example.com\n---\n",
      "_events/no-url.md" => "---\ntitle: Event\ndate: 2026-10-04\nlinks:\n  - label: Link\n---\n",
      "_events/unsafe.md" => "---\ntitle: Event\ndate: 2026-10-04\nlinks:\n  - label: Link\n    url: javascript:alert(1)\n---\n"
    )
    refute status.success?
    output = out + _err
    %w[_news/missing.md _news/bad-date.md _events/not-list.md _events/no-label.md _events/no-url.md _events/unsafe.md].each { |name| assert_includes output, name }
    assert_includes output, "title is required"
    assert_includes output, "date must use YYYY-MM-DD"
    assert_includes output, "links must be a list"
    assert_includes output, "links[0].label"
    assert_includes output, "links[0].url"
    assert_includes output, "unsupported scheme"
  end

  def test_rejects_noncanonical_date_format
    out, _err, status = run_validator("_news/bad.md" => "---\ntitle: Bad\ndate: '2026/10/04'\n---\n")
    refute status.success?
    assert_includes out + _err, "date must use YYYY-MM-DD"
  end

  def test_detects_effective_output_collisions_and_permalink_override
    out, _err, status = run_validator(
      "_news/same.md" => "---\ntitle: One\ndate: 2026-10-04\n---\n",
      "_news/other.md" => "---\ntitle: Two\ndate: 2026-10-05\npermalink: /news/same/\n---\n"
    )
    refute status.success?
    assert_includes out + _err, "_news/same.md"
    assert_includes out + _err, "_news/other.md"
    assert_includes out + _err, "/news/same/"
  end
end

# frozen_string_literal: true

require "minitest/autorun"
require "tmpdir"
require "fileutils"
require "open3"

SCRIPT = File.expand_path("../scripts/check-site.rb", __dir__)

class SiteIntegrityTest < Minitest::Test
  def run_checker(files)
    Dir.mktmpdir do |site|
      route_locs = %w[/ /about/ /history/ /news-events/ /get-involved/ /support/ /contact/].map { |route| "<url><loc>https://jussaa.org#{route}</loc></url>" }.join
      files = { "robots.txt" => "User-agent: *\nAllow: /\n\nSitemap: https://jussaa.org/sitemap.xml\n", "sitemap.xml" => "<?xml version=\"1.0\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">#{route_locs}</urlset>" }.merge(files)
      files.each do |name, contents|
        path = File.join(site, name)
        FileUtils.mkdir_p(File.dirname(path))
        File.write(path, contents)
      end
      Open3.capture3({ "SITE_ROOT" => site }, "ruby", SCRIPT)
    end
  end

  def test_accepts_valid_internal_page_asset_and_fragment
    _out, err, status = run_checker(
      "index.html" => '<a href="#home">Home</a><h1 id="home">Welcome</h1><a href="/about/#story">About</a><img src="/assets/logo.svg">',
      "about/index.html" => '<h2 id="story">About</h2>',
      "assets/logo.svg" => '<svg></svg>'
    )
    assert status.success?, err
  end

  def test_reports_missing_internal_page_asset_and_fragment
    out, _err, status = run_checker("index.html" => '<a href="#missing"><a href="/missing/"><img src="/assets/missing.svg"><a href="/about/#absent">', "about/index.html" => '<h1>About</h1>')
    refute status.success?
    assert_includes out + _err, "broken internal reference /missing/"
    assert_includes out + _err, "broken internal reference /assets/missing.svg"
    assert_includes out + _err, "missing fragment #absent"
    assert_includes out + _err, "missing fragment #missing"
  end

  def test_rejects_fixture_leakage
    out, _err, status = run_checker("index.html" => '<p>visual-interior</p>')
    refute status.success?
    assert_includes out + _err, "fixture content leaked"
  end
end

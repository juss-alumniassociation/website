# frozen_string_literal: true

require "cgi"
require "uri"
require "jekyll"
require "jekyll/commands/serve/live_reload_reactor"
require "jekyll/commands/serve/servlet"

# Load from the preview launcher, rather than _plugins: github-pages forces safe
# mode and disables local plugins. Keep this compatibility fix out of site builds.
module PreviewLiveReload
  module Connection
    MAX_REQUEST_BYTES = 64 * 1024

    def dispatch(data)
      # TCP can split an HTTP request or WebSocket handshake across reads.
      # Jekyll 3.10 creates a fresh parser per read, losing partial headers.
      @preview_request ||= +"".b
      @preview_request << data
      if @preview_request.bytesize > MAX_REQUEST_BYTES
        close_connection
        return
      end

      @preview_parser ||= Http::Parser.new.tap do |parser|
        parser.on_headers_complete = proc do
          @preview_headers_complete = true
          :stop
        end
      end
      @preview_parser << data
      return unless @preview_headers_complete

      super(@preview_request)
    rescue HTTP::Parser::Error => error
      # TLS probes and malformed requests must not reach the reactor's fatal
      # error handler. The LiveReload listener accepts plain HTTP/WS traffic.
      Jekyll.logger.debug "LiveReload:", "Rejected connection (#{error.class})"
      close_connection
    end
  end

  module Reactor
    def handle_websockets_event(websocket)
      super
      # em-websocket already closes a client on protocol/application errors,
      # but Jekyll's onerror callback re-raises them and stops every connection.
      websocket.onerror do |error|
        Jekyll.logger.debug "LiveReload:", "Rejected connection (#{error.class})"
        websocket.close_connection
      end
    end
  end

  module Client
    def template
      return super unless PreviewLiveReload.origin

      # Use the browser-facing origin when an HTTPS proxy terminates TLS before
      # forwarding to Jekyll's plain listener. External and internal ports differ.
      uri = PreviewLiveReload.origin.dup
      uri.path = "/livereload.js"
      params = { "snipver" => 1, "port" => uri.port }
      params["mindelay"] = @options["livereload_min_delay"] if @options["livereload_min_delay"]
      params["maxdelay"] = @options["livereload_max_delay"] if @options["livereload_max_delay"]
      uri.query = URI.encode_www_form(params)
      ERB.new(%(<script src="#{CGI.escapeHTML(uri.to_s)}"></script>))
    end
  end

  def self.origin
    @origin
  end

  url = ENV["JEKYLL_LIVERELOAD_URL"]
  if url.to_s.empty? && ENV["CODESPACES"] == "true"
    name = ENV.fetch("CODESPACE_NAME")
    domain = ENV.fetch("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "app.github.dev")
    port = ENV.fetch("JEKYLL_LIVERELOAD_PORT", "35729")
    url = "https://#{name}-#{port}.#{domain}"
  end
  unless url.to_s.empty?
    @origin = URI.parse(url)
    unless @origin.is_a?(URI::HTTP) && @origin.host && !@origin.userinfo &&
           !@origin.query && !@origin.fragment && ["", "/"].include?(@origin.path)
      abort "JEKYLL_LIVERELOAD_URL must be an HTTP(S) origin, e.g. https://reload.example.com"
    end
  end
end

Jekyll::Commands::Serve::HttpAwareConnection.prepend(PreviewLiveReload::Connection)
Jekyll::Commands::Serve::LiveReloadReactor.prepend(PreviewLiveReload::Reactor)
Jekyll::Commands::Serve::BodyProcessor.prepend(PreviewLiveReload::Client)

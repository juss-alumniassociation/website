import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import tls from 'node:tls';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const root = fileURLToPath(new URL('../', import.meta.url));

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

async function unusedPort() {
  const server = net.createServer();
  const port = await listen(server);
  await new Promise(resolve => server.close(resolve));
  return port;
}

function html(marker) {
  return `---\n---\n<!doctype html><html><head><title>LiveReload test</title><link rel="icon" href="data:,"></head><body><p id="marker">${marker}</p></body></html>`;
}

async function startPreview(t, secure) {
  const dir = await mkdtemp(path.join(tmpdir(), 'jekyll-live-reload-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const source = path.join(dir, 'source');
  await mkdir(source);
  const index = path.join(source, 'index.html');
  await writeFile(index, html('before'));
  const [sitePort, reloadPort] = await Promise.all([unusedPort(), unusedPort()]);
  const config = path.join(dir, 'config.yml');
  await writeFile(config, JSON.stringify({ source, destination: path.join(dir, '_site'), theme: null, baseurl: '' }));
  const proxy = secure ? await tlsProxy(t, dir, sitePort, reloadPort) : null;
  const env = {
    ...process.env,
    CODESPACES: 'false',
    JEKYLL_HOST: '127.0.0.1',
    JEKYLL_PORT: String(sitePort),
    JEKYLL_LIVERELOAD_PORT: String(reloadPort),
    JEKYLL_CONFIG: `${path.join(root, '_config.yml')},${config}`,
  };
  delete env.JEKYLL_LIVERELOAD;
  delete env.JEKYLL_BASEURL;
  delete env.JEKYLL_LIVERELOAD_URL;
  if (proxy) env.JEKYLL_LIVERELOAD_URL = proxy.url;

  const server = spawn(path.join(root, 'scripts/serve.sh'), [], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  server.stdout.on('data', chunk => { output += chunk; });
  server.stderr.on('data', chunk => { output += chunk; });
  t.after(async () => {
    if (server.exitCode === null && server.signalCode === null) {
      const stopped = once(server, 'exit');
      server.kill('SIGINT');
      const timeout = setTimeout(() => server.kill('SIGKILL'), 5000);
      await stopped;
      clearTimeout(timeout);
    }
  });
  const siteURL = `http://127.0.0.1:${sitePort}`;
  const deadline = Date.now() + 30_000;
  while (true) {
    assert.equal(server.exitCode, null, `Preview exited during startup:\n${output}`);
    try {
      const response = await fetch(siteURL, { signal: AbortSignal.timeout(500) });
      if (response.ok && output.includes('Server running')) break;
    } catch {}
    assert.ok(Date.now() < deadline, `Preview did not start:\n${output}`);
    await delay(100);
  }
  return { index, siteURL, url: proxy?.url ?? siteURL, reloadPort, server, output: () => output };
}

async function tlsProxy(t, dir, sitePort, reloadPort) {
  const keyFile = path.join(dir, 'key.pem');
  const certFile = path.join(dir, 'cert.pem');
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-keyout', keyFile, '-out', certFile, '-subj', '/CN=localhost'], { stdio: 'ignore' });
  const proxy = https.createServer({ key: await readFile(keyFile), cert: await readFile(certFile) }, (request, response) => {
    const port = request.url.startsWith('/livereload.js') ? reloadPort : sitePort;
    const upstream = http.request({ hostname: '127.0.0.1', port, method: request.method, path: request.url, headers: request.headers }, incoming => {
      response.writeHead(incoming.statusCode, incoming.headers);
      incoming.pipe(response);
    });
    upstream.on('error', () => { response.writeHead(502); response.end(); });
    request.pipe(upstream);
  });
  const sockets = new Set();
  proxy.on('connection', socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  proxy.on('upgrade', (request, socket, head) => {
    const upstream = net.connect(reloadPort, '127.0.0.1', () => {
      const headers = Object.entries(request.headers).map(([name, value]) => `${name}: ${value}`).join('\r\n');
      upstream.write(`${request.method} ${request.url} HTTP/1.1\r\n${headers}\r\n\r\n`);
      if (head.length) upstream.write(head);
      socket.pipe(upstream).pipe(socket);
    });
    upstream.on('error', () => socket.destroy());
    socket.on('error', () => upstream.destroy());
    socket.on('close', () => upstream.destroy());
  });
  const port = await listen(proxy);
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => proxy.close(resolve));
  });
  return { url: `https://127.0.0.1:${port}` };
}

// Exercise the actual listener, including requests split across TCP reads.
async function exchange(port, chunks, stopAt = null) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1');
    const parts = [];
    let settled = false;
    function finish(error) {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve(Buffer.concat(parts).toString());
    }
    socket.setNoDelay(true);
    socket.setTimeout(5000, () => finish(new Error('LiveReload connection did not finish')));
    socket.on('error', error => finish(error.code === 'ECONNRESET' ? null : error));
    socket.on('end', () => finish());
    socket.on('data', chunk => {
      parts.push(chunk);
      if (stopAt && Buffer.concat(parts).toString().includes(stopAt)) finish();
    });
    socket.on('connect', async () => {
      for (const chunk of chunks) {
        if (socket.destroyed) break;
        socket.write(chunk);
        await delay(100);
      }
    });
  });
}

async function tlsProbe(port) {
  await new Promise((resolve, reject) => {
    const socket = tls.connect({ host: '127.0.0.1', port, rejectUnauthorized: false });
    socket.setTimeout(5000, () => { socket.destroy(); reject(new Error('TLS probe was not rejected')); });
    socket.once('secureConnect', () => { socket.destroy(); reject(new Error('Plain LiveReload unexpectedly accepted TLS')); });
    socket.once('error', resolve);
  });
}

function upgradeHeaders(version = '13') {
  return `GET /livereload HTTP/1.1\r\nHost: localhost\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: ${version}\r\n\r\n`;
}

test('Codespaces uses the forwarded HTTPS hostname and external port 443', () => {
  const env = {
    ...process.env,
    CODESPACES: 'true',
    CODESPACE_NAME: 'preview-test',
    GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: 'app.github.dev',
    JEKYLL_LIVERELOAD_PORT: '35730',
  };
  delete env.JEKYLL_LIVERELOAD_URL;
  const script = execFileSync('bundle', ['exec', 'ruby', '-r', './scripts/live_reload', '-e',
    'puts Jekyll::Commands::Serve::BodyProcessor.new("", {}).template.result'], { cwd: root, env, encoding: 'utf8' });
  assert.match(script, /https:\/\/preview-test-35730\.app\.github\.dev\/livereload\.js\?snipver=1&amp;port=443/);
});

for (const secure of [false, true]) {
  test(`live reload survives invalid clients ${secure ? 'through an HTTPS/WSS proxy' : 'on a direct HTTP/WS connection'}`, { timeout: 60_000 }, async t => {
    const preview = await startPreview(t, secure);
    const browser = await chromium.launch({ headless: false });
    t.after(() => browser.close());
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const websocketURLs = [];
    page.on('websocket', socket => websocketURLs.push(socket.url()));
    await page.goto(preview.url);
    await page.waitForFunction(() => window.LiveReload?.connector?.protocol === 7);
    await expect(page.locator('#marker')).toHaveText('before');
    assert.ok(websocketURLs.some(url => url.startsWith(secure ? 'wss://' : 'ws://')));

    // An established browser connection must survive all of these other clients.
    await tlsProbe(preview.reloadPort);
    assert.equal(await exchange(preview.reloadPort, ['not an HTTP request\r\n\r\n']), '');
    assert.equal(await exchange(preview.reloadPort, [upgradeHeaders('999')]), '');
    assert.equal(await exchange(preview.reloadPort, ['GET /livereload.js HTTP/1.1\r\nX-Fill: ' + 'x'.repeat(70_000)]), '');
    const fragmentedScript = await exchange(preview.reloadPort, ['GET /live', 'reload.js HTTP/1.1\r\nHost: localhost\r\n\r\n']);
    assert.match(fragmentedScript, /^HTTP\/1.1 200 OK/);
    assert.match(fragmentedScript, /window.LiveReload/);
    const handshake = upgradeHeaders();
    const fragmentedUpgrade = await exchange(preview.reloadPort, [handshake.slice(0, 40), handshake.slice(40)], '\r\n\r\n');
    assert.match(fragmentedUpgrade, /^HTTP\/1.1 101/);

    // Invalid JSON is an application error inside em-websocket's receive callback.
    const malformedClient = new WebSocket(`ws://127.0.0.1:${preview.reloadPort}/livereload`);
    await once(malformedClient, 'open');
    const closed = once(malformedClient, 'close');
    malformedClient.send('not-json');
    await closed;

    await writeFile(preview.index, html('after'));
    await expect(page.locator('#marker')).toHaveText('after', { timeout: 15_000 });
    await page.waitForFunction(() => window.LiveReload?.connector?.protocol === 7);
    assert.equal(preview.server.exitCode, null, preview.output());
    assert.doesNotMatch(preview.output(), /terminated with exception|LiveReload experienced an error/);
    assert.deepEqual(errors, []);

    // Confirm a new browser can connect after the malformed traffic and rebuild.
    const newcomer = await context.newPage();
    await newcomer.goto(preview.url);
    await newcomer.waitForFunction(() => window.LiveReload?.connector?.protocol === 7);
    await expect(newcomer.locator('#marker')).toHaveText('after');
  });
}

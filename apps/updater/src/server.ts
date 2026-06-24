import { spawn } from 'node:child_process';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

const PORT = Number(process.env.PORT ?? 8090);
const TOKEN = process.env.DOCSOPS_UPDATER_TOKEN?.trim() ?? '';
const INSTALL_DIR = process.env.DOCSOPS_INSTALL_DIR?.trim() || '/opt/docsops';
const HEALTH_URL = process.env.DOCSOPS_HEALTH_URL?.trim() || 'http://host.docker.internal/health';

let running = false;
let currentVersion: string | null = null;
let startedAt: string | null = null;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function isAuthorized(req: IncomingMessage): boolean {
  if (!TOKEN) return false;
  const header = req.headers.authorization ?? '';
  return header === `Bearer ${TOKEN}`;
}

function spawnUpdate(version: string): void {
  const script = `${INSTALL_DIR}/scripts/update.sh`;
  const child = spawn('bash', [script, version], {
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      DOCSOPS_INSTALL_DIR: INSTALL_DIR,
      DOCSOPS_HEALTH_URL: HEALTH_URL,
    },
  });
  child.unref();
  running = true;
  currentVersion = version;
  startedAt = new Date().toISOString();
  child.on('exit', () => {
    running = false;
  });
}

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { error: 'Bad request' });
    return;
  }

  const path = req.url.split('?')[0] ?? req.url;

  if (path === '/internal/status' && req.method === 'GET') {
    if (!isAuthorized(req)) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }
    sendJson(res, 200, {
      running,
      version: currentVersion,
      startedAt,
    });
    return;
  }

  if (path === '/internal/apply' && req.method === 'POST') {
    if (!isAuthorized(req)) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }
    if (running) {
      sendJson(res, 409, { error: 'Update already running' });
      return;
    }

    let body: { version?: string };
    try {
      const raw = await readBody(req);
      body = JSON.parse(raw) as { version?: string };
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    const version = typeof body.version === 'string' ? body.version.trim() : '';
    if (!/^v\d+\.\d+\.\d+$/.test(version)) {
      sendJson(res, 400, { error: 'version must be a release tag like v0.1.0' });
      return;
    }

    try {
      spawnUpdate(version);
      sendJson(res, 202, { accepted: true, version });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start update';
      sendJson(res, 500, { error: message });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

if (!TOKEN) {
  console.error('ERROR: DOCSOPS_UPDATER_TOKEN is required');
  process.exit(1);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`docsops-updater listening on ${PORT}`);
});

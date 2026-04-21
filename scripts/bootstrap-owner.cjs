#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { URL } = require('node:url');
const dotenv = require('dotenv');

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEFAULT_WEB_LOGIN_URL = 'http://localhost:5174/login';
const REQUEST_TIMEOUT_MS = 10000;
const OWNER_BOOTSTRAP_PASSWORD_MIN_LENGTH = 14;
const WINDOWS_CREDENTIAL_HELPER = path.join(__dirname, 'windows-credential-secret.ps1');
const ENV_FILENAMES = ['.env', '.env.local'];
const ENV_FILE_BLOCKED_KEYS = new Set([
  'OWNER_BOOTSTRAP_KEY',
  'OWNER_BOOTSTRAP_PASSWORD',
  'VITE_DEV_OWNER_PASSWORD',
  'VITE_DEV_EMPLOYEE_PASSWORD',
]);

function loadRepoEnvironment() {
  const repoRoot = path.resolve(__dirname, '..');
  const protectedKeys = new Set(Object.keys(process.env));

  for (const filename of ENV_FILENAMES) {
    const filePath = path.join(repoRoot, filename);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const parsed = dotenv.parse(fs.readFileSync(filePath));
    for (const [key, value] of Object.entries(parsed)) {
      if (ENV_FILE_BLOCKED_KEYS.has(key)) {
        continue;
      }

      if (!protectedKeys.has(key)) {
        process.env[key] = value;
      }
    }
  }
}

loadRepoEnvironment();

function printUsage() {
  console.log(`Owner bootstrap CLI

Usage:
  npm run owner:bootstrap -- --email owner@example.com [options]

Options:
  --email <value>             Owner email address (required)
  --display-name <value>      Optional display name stored with the owner account
  --password <value>          Owner password (avoid this on shared machines)
  --password-stdin            Read the password from stdin
  --bootstrap-key-stdin       Read the bootstrap key from stdin
  --bootstrap-key <value>     One-time bootstrap key
  --api-base-url <value>      API base URL (default: ${DEFAULT_API_BASE_URL})
  --web-login-url <value>     Web login URL shown after success (default: ${DEFAULT_WEB_LOGIN_URL})
  --help                      Show this help

Environment fallbacks:
  OWNER_BOOTSTRAP_KEY
  OWNER_BOOTSTRAP_KEY_CREDENTIAL_TARGET
  OWNER_BOOTSTRAP_KEY_FILE
  OWNER_BOOTSTRAP_API_BASE_URL
  OWNER_BOOTSTRAP_WEB_LOGIN_URL
`);
}

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help') {
      options.help = true;
      continue;
    }

    if (arg === '--password-stdin') {
      options.passwordStdin = true;
      continue;
    }

    if (arg === '--bootstrap-key-stdin') {
      options.bootstrapKeyStdin = true;
      continue;
    }

    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }

    options[key] = next;
    index += 1;
  }

  return options;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('').trim()));
    process.stdin.on('error', reject);
  });
}

function requireValue(value, name) {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function readSecretFromFile(filePath) {
  if (!filePath) {
    return '';
  }

  return fs.readFileSync(path.resolve(filePath), 'utf8').trim();
}

function readSecretFromWindowsCredentialManager(target) {
  if (!target || process.platform !== 'win32') {
    return '';
  }

  const { spawnSync } = require('node:child_process');
  const result = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      WINDOWS_CREDENTIAL_HELPER,
      '-Action',
      'get',
      '-Target',
      target,
    ],
    {
      encoding: 'utf8',
      windowsHide: true,
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `Unable to read bootstrap key from Windows Credential Manager target ${target}: ${(result.stderr || result.stdout || '').trim() || 'unknown error'}`,
    );
  }

  return result.stdout.trim();
}

function promptForSecret(label) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      reject(new Error(`${label} is required. Use CLI flags or stdin in non-interactive mode.`));
      return;
    }

    process.stdout.write(`${label}: `);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    rl._writeToOutput = () => {};
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer.trim());
    });
    rl.on('SIGINT', () => {
      rl.close();
      reject(new Error('Input cancelled by user'));
    });
  });
}

function validatePassword(password) {
  if (password.length < OWNER_BOOTSTRAP_PASSWORD_MIN_LENGTH) {
    throw new Error(`Owner password must be at least ${OWNER_BOOTSTRAP_PASSWORD_MIN_LENGTH} characters long`);
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new Error('Owner password must include uppercase, lowercase, number, and symbol characters');
  }
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  if (options.passwordStdin && options.bootstrapKeyStdin) {
    throw new Error('Use stdin for only one secret at a time');
  }

  const email = requireValue(options.email, '--email');
  const displayName = options['display-name'];
  const apiBaseUrl = options['api-base-url'] || process.env.OWNER_BOOTSTRAP_API_BASE_URL || DEFAULT_API_BASE_URL;
  const webLoginUrl = options['web-login-url'] || process.env.OWNER_BOOTSTRAP_WEB_LOGIN_URL || DEFAULT_WEB_LOGIN_URL;

  let bootstrapKey =
    options['bootstrap-key']
    || process.env.OWNER_BOOTSTRAP_KEY
    || readSecretFromWindowsCredentialManager(process.env.OWNER_BOOTSTRAP_KEY_CREDENTIAL_TARGET)
    || readSecretFromFile(process.env.OWNER_BOOTSTRAP_KEY_FILE);
  if (!bootstrapKey && options.bootstrapKeyStdin) {
    bootstrapKey = await readStdin();
  }
  if (!bootstrapKey) {
    bootstrapKey = await promptForSecret('Bootstrap key');
  }

  let password = options.password;
  if (!password && options.passwordStdin) {
    password = await readStdin();
  }
  if (!password) {
    password = await promptForSecret('Owner password');
  }

  requireValue(
    bootstrapKey,
    '--bootstrap-key, --bootstrap-key-stdin, OWNER_BOOTSTRAP_KEY, OWNER_BOOTSTRAP_KEY_CREDENTIAL_TARGET, or OWNER_BOOTSTRAP_KEY_FILE',
  );
  password = requireValue(password, '--password or --password-stdin');
  validatePassword(password);

  const bootstrapStatusUrl = new URL('/api/auth/owner/bootstrap', apiBaseUrl).toString();
  const bootstrapSessionUrl = new URL('/api/auth/owner/bootstrap/session', apiBaseUrl).toString();
  const bootstrapCompleteUrl = new URL('/api/auth/owner/bootstrap', apiBaseUrl).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const statusResponse = await fetch(bootstrapStatusUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    const statusPayload = await parseJsonResponse(statusResponse);

    if (!statusResponse.ok) {
      const code = statusPayload?.error?.code ?? 'UNKNOWN_ERROR';
      const message = statusPayload?.error?.message ?? statusResponse.statusText;
      throw new Error(`Bootstrap status check failed (${statusResponse.status} ${code}): ${message}`);
    }

    if (!statusPayload?.data?.available) {
      throw new Error(statusPayload?.data?.detail || 'Owner bootstrap is not available');
    }

    const sessionResponse = await fetch(bootstrapSessionUrl, {
      method: 'POST',
      headers: {
        'x-owner-bootstrap-key': bootstrapKey,
      },
      signal: controller.signal,
    });
    const sessionPayload = await parseJsonResponse(sessionResponse);

    if (!sessionResponse.ok) {
      const code = sessionPayload?.error?.code ?? 'UNKNOWN_ERROR';
      const message = sessionPayload?.error?.message ?? sessionResponse.statusText;
      throw new Error(`Bootstrap session creation failed (${sessionResponse.status} ${code}): ${message}`);
    }

    const bootstrapSessionToken = sessionPayload?.data?.bootstrapSessionToken;
    if (!bootstrapSessionToken) {
      throw new Error('Bootstrap session creation succeeded but no secure session token was returned');
    }

    const response = await fetch(bootstrapCompleteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bootstrapSessionToken,
        email,
        password,
        ...(displayName ? { displayName } : {}),
      }),
      signal: controller.signal,
    });

    const payload = await parseJsonResponse(response);

    if (!response.ok) {
      const code = payload?.error?.code ?? 'UNKNOWN_ERROR';
      const message = payload?.error?.message ?? response.statusText;
      throw new Error(`Bootstrap failed (${response.status} ${code}): ${message}`);
    }

    const owner = payload?.data;
    if (!owner?.uid || owner.role !== 'owner') {
      throw new Error('Bootstrap succeeded but the response payload is missing the owner account contract');
    }

    console.log('Owner bootstrap succeeded.');
    console.log(`UID: ${owner.uid}`);
    console.log(`Email: ${owner.email}`);
    console.log(`Role: ${owner.role}`);
    console.log(`Plane: ${owner.plane}`);
    console.log(`Next: sign in via ${webLoginUrl}`);
  } finally {
    clearTimeout(timeout);
  }
}

main().catch((error) => {
  console.error(`owner:bootstrap failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

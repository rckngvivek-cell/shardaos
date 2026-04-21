#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Repo Scan
 *
 * Goal: produce a repeatable, deterministic inventory of *every tracked file* in the repository
 * with lightweight metadata (size/LOC/type/category) and a best-effort human description.
 *
 * Why this exists:
 * - Manual "scan everything" requests are slow, inconsistent, and get stale quickly.
 * - `git ls-files` is the source of truth for what is actually versioned in the repo.
 * - The report is designed for reviewability, not for reproducing file contents.
 *
 * Output:
 * - Markdown report (grouped by category)
 * - Optional JSON inventory for automation
 *
 * Usage:
 *   node scripts/repo-scan.cjs --out docs/reports/repo-scan-YYYY-MM-DD.md
 *   node scripts/repo-scan.cjs --out ... --json docs/reports/repo-scan-YYYY-MM-DD.json
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function execGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trimEnd();
}

function execGitBuffer(args) {
  return execFileSync('git', args, { encoding: 'buffer' });
}

function parseArgs(argv) {
  const out = {
    outPath: '',
    jsonPath: '',
    maxDescriptionChars: 140,
    maxReadBytes: 8192,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') {
      out.outPath = argv[i + 1] || '';
      i += 1;
      continue;
    }
    if (arg === '--json') {
      out.jsonPath = argv[i + 1] || '';
      i += 1;
      continue;
    }
    if (arg === '--max-desc') {
      out.maxDescriptionChars = Number.parseInt(argv[i + 1] || '', 10);
      i += 1;
      continue;
    }
    if (arg === '--max-read-bytes') {
      out.maxReadBytes = Number.parseInt(argv[i + 1] || '', 10);
      i += 1;
      continue;
    }
  }

  // Default output is date-stamped so reports can be committed historically.
  if (!out.outPath) {
    const dateStamp = new Date().toISOString().slice(0, 10);
    out.outPath = `docs/reports/repo-scan-${dateStamp}.md`;
  }

  return out;
}

function detectBinary(buffer) {
  // Heuristic: NUL bytes are a strong signal; enough for our purposes.
  return buffer.includes(0);
}

function countNewlines(buffer) {
  let newlines = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    if (buffer[i] === 10) newlines += 1; // \n
  }
  if (buffer.length === 0) return 0;
  // If the file ends with a newline, the number of lines equals the newline count.
  if (buffer[buffer.length - 1] === 10) return newlines;
  return newlines + 1;
}

function safeReadStart(absPath, maxBytes) {
  const fd = fs.openSync(absPath, 'r');
  try {
    const buf = Buffer.alloc(maxBytes);
    const read = fs.readSync(fd, buf, 0, maxBytes, 0);
    return buf.slice(0, read);
  } finally {
    fs.closeSync(fd);
  }
}

function normalizeDescription(raw, maxChars) {
  const trimmed = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  const capped = trimmed.length > maxChars ? `${trimmed.slice(0, maxChars - 1)}…` : trimmed;
  // Markdown table safety.
  return capped.replaceAll('|', '\\|');
}

function extractMarkdownTitle(text) {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) return trimmed.slice(2).trim();
  }
  return '';
}

function extractTopComment(text) {
  const lines = text.split(/\r?\n/);
  // Skip shebang.
  let i = 0;
  if (lines[0]?.startsWith('#!')) i += 1;

  // Skip empty lines.
  while (i < lines.length && !lines[i].trim()) i += 1;
  if (i >= lines.length) return '';

  const first = lines[i].trim();
  if (first.startsWith('//')) {
    const out = [];
    while (i < lines.length && lines[i].trim().startsWith('//')) {
      out.push(lines[i].trim().replace(/^\/\/\s?/, ''));
      i += 1;
    }
    return out.join(' ').trim();
  }

  if (first.startsWith('/*')) {
    const out = [];
    while (i < lines.length) {
      const line = lines[i];
      out.push(line);
      if (line.includes('*/')) break;
      i += 1;
    }
    const joined = out.join('\n');
    const cleaned = joined
      .replace(/^\/\*\*?/, '')
      .replace(/\*\/$/, '')
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*\*\s?/, '').trim())
      .filter(Boolean);
    return cleaned.join(' ').trim();
  }

  return '';
}

function guessCategory(relPath) {
  if (relPath.startsWith('.github/workflows/')) return 'GitHub Actions';
  if (relPath.startsWith('.github/')) return 'GitHub';
  if (relPath.startsWith('apps/api/')) return 'API';
  if (relPath.startsWith('apps/owner/')) return 'Owner';
  if (relPath.startsWith('apps/employee/')) return 'Employee';
  if (relPath.startsWith('apps/school/')) return 'School';
  if (relPath.startsWith('apps/mobile/')) return 'Mobile';
  if (relPath.startsWith('packages/shared/')) return 'Shared';
  if (relPath.startsWith('docs/')) return 'Docs';
  if (relPath.startsWith('infrastructure/')) return 'Infrastructure';
  if (relPath.startsWith('terraform/')) return 'Terraform';
  if (relPath.startsWith('k6/')) return 'Load Test';
  if (relPath.startsWith('.codex/')) return 'Codex';
  return 'Root';
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function stableSortByPath(a, b) {
  return a.path.localeCompare(b.path);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const repoRoot = execGit(['rev-parse', '--show-toplevel']);
  process.chdir(repoRoot);

  const branch = execGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const commit = execGit(['rev-parse', 'HEAD']);
  const dirty = execGit(['status', '--porcelain']);
  const isDirty = dirty.length > 0;

  const nowIso = new Date().toISOString();
  const fileListBuf = execGitBuffer(['ls-files', '-z']);
  const relPaths = fileListBuf
    .toString('utf8')
    .split('\0')
    .filter(Boolean);

  const entries = [];
  for (const relPath of relPaths) {
    const absPath = path.join(repoRoot, relPath);
    const stat = fs.statSync(absPath);

    const ext = path.extname(relPath).toLowerCase();
    const category = guessCategory(relPath);

    const startBuf = safeReadStart(absPath, args.maxReadBytes);
    const isBinary = detectBinary(startBuf);

    let lines = null;
    let description = '';

    if (!isBinary) {
      const fullBuf = fs.readFileSync(absPath);
      lines = countNewlines(fullBuf);

      const textStart = startBuf.toString('utf8');
      if (ext === '.md') {
        description = extractMarkdownTitle(textStart);
      } else if (
        ext === '.ts' ||
        ext === '.tsx' ||
        ext === '.js' ||
        ext === '.jsx' ||
        ext === '.cjs' ||
        ext === '.mjs'
      ) {
        description = extractTopComment(textStart);
      } else if (ext === '.yml' || ext === '.yaml') {
        const firstLine = textStart.split(/\r?\n/).find((l) => l.trim().length > 0) || '';
        description = firstLine.startsWith('#') ? firstLine.replace(/^#\s?/, '') : '';
      }
    }

    entries.push({
      path: relPath,
      category,
      ext: ext || '(none)',
      bytes: stat.size,
      lines,
      binary: isBinary,
      description: normalizeDescription(description, args.maxDescriptionChars),
    });
  }

  entries.sort(stableSortByPath);

  const totals = {
    files: entries.length,
    bytes: entries.reduce((sum, e) => sum + e.bytes, 0),
    textFiles: entries.filter((e) => !e.binary).length,
    binaryFiles: entries.filter((e) => e.binary).length,
    totalLines: entries.reduce((sum, e) => sum + (typeof e.lines === 'number' ? e.lines : 0), 0),
  };

  const byCategory = new Map();
  for (const e of entries) {
    const prev = byCategory.get(e.category) || { files: 0, bytes: 0, lines: 0 };
    byCategory.set(e.category, {
      files: prev.files + 1,
      bytes: prev.bytes + e.bytes,
      lines: prev.lines + (typeof e.lines === 'number' ? e.lines : 0),
    });
  }

  const largest = [...entries]
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 15);

  const md = [];
  md.push('# Repository Scan Report');
  md.push('');
  md.push(`Date (UTC): ${nowIso}`);
  md.push(`Repo root: \`${repoRoot}\``);
  md.push(`Branch: \`${branch}\``);
  md.push(`Commit: \`${commit}\``);
  md.push(`Working tree: ${isDirty ? '**DIRTY**' : 'clean'}`);
  md.push('');

  md.push('## Inventory Summary');
  md.push('');
  md.push(`- Tracked files: **${totals.files}**`);
  md.push(`- Total size: **${formatBytes(totals.bytes)}**`);
  md.push(`- Text files: **${totals.textFiles}**`);
  md.push(`- Binary files: **${totals.binaryFiles}**`);
  md.push(`- Total lines (text only): **${totals.totalLines.toLocaleString('en-US')}**`);
  md.push('');

  md.push('## By Category');
  md.push('');
  md.push('| Category | Files | Size | Lines |');
  md.push('| --- | ---: | ---: | ---: |');
  for (const [category, stats] of [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    md.push(`| ${category} | ${stats.files} | ${formatBytes(stats.bytes)} | ${stats.lines.toLocaleString('en-US')} |`);
  }
  md.push('');

  md.push('## Largest Files');
  md.push('');
  md.push('| Path | Size | Lines |');
  md.push('| --- | ---: | ---: |');
  for (const e of largest) {
    md.push(`| \`${e.path}\` | ${formatBytes(e.bytes)} | ${typeof e.lines === 'number' ? e.lines : '—'} |`);
  }
  md.push('');

  md.push('## File Index (All Tracked Files)');
  md.push('');
  md.push('| Path | Category | Ext | Size | Lines | Binary | Description |');
  md.push('| --- | --- | --- | ---: | ---: | :---: | --- |');
  for (const e of entries) {
    md.push(
      `| \`${e.path}\` | ${e.category} | ${e.ext} | ${e.bytes} | ${typeof e.lines === 'number' ? e.lines : '—'} | ${
        e.binary ? 'yes' : 'no'
      } | ${e.description || ''} |`,
    );
  }
  md.push('');

  const outAbs = path.resolve(repoRoot, args.outPath);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, `${md.join('\n')}\n`, 'utf8');

  if (args.jsonPath) {
    const jsonAbs = path.resolve(repoRoot, args.jsonPath);
    fs.mkdirSync(path.dirname(jsonAbs), { recursive: true });
    fs.writeFileSync(
      jsonAbs,
      `${JSON.stringify(
        {
          generatedAtUtc: nowIso,
          repoRoot,
          branch,
          commit,
          dirty: isDirty,
          totals,
          entries,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
  }

  console.log(`Wrote report: ${path.relative(repoRoot, outAbs)}`);
  if (args.jsonPath) {
    console.log(`Wrote JSON: ${args.jsonPath}`);
  }
}

main();

import express from 'express';

import { loadFounderConfig } from './config';
import { localOnlyMiddleware } from './middleware/local-only';

type MetricCard = {
  label: string;
  value: string;
  delta: string;
};

const metrics: MetricCard[] = [
  { label: 'Active schools', value: '47', delta: '+3 this week' },
  { label: 'Total students', value: '47,250', delta: '+1,120 this month' },
  { label: 'Monthly revenue', value: 'INR 95.3L', delta: '+8.4% MoM' },
  { label: 'Pending approvals', value: '2', delta: 'Requires founder review' },
];

function renderHomePage(config: { appName: string; port: number }): string {
  const cards = metrics
    .map(
      (metric) => `
        <article class="card">
          <p class="label">${metric.label}</p>
          <p class="value">${metric.value}</p>
          <p class="delta">${metric.delta}</p>
        </article>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.appName}</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #08111f;
        --panel: rgba(255, 255, 255, 0.08);
        --border: rgba(255, 255, 255, 0.12);
        --text: #eef4ff;
        --muted: rgba(238, 244, 255, 0.72);
        --accent: #7dd3fc;
        --shadow: 0 24px 60px rgba(0, 0, 0, 0.24);
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(125, 211, 252, 0.18), transparent 32%),
          radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.16), transparent 34%),
          var(--bg);
      }
      main {
        max-width: 1120px;
        margin: 0 auto;
        padding: 40px 20px 64px;
      }
      h1 {
        margin: 0;
        font-size: clamp(2.25rem, 4vw, 4rem);
        letter-spacing: -0.04em;
      }
      .subtitle {
        max-width: 760px;
        color: var(--muted);
        line-height: 1.6;
        margin: 16px 0 0;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 22px;
      }
      .chip {
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-top: 28px;
      }
      .card {
        border: 1px solid var(--border);
        border-radius: 24px;
        background: var(--panel);
        padding: 20px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(16px);
      }
      .label {
        margin: 0;
        font-size: 12px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--accent);
      }
      .value {
        margin: 14px 0 0;
        font-size: 32px;
        font-weight: 700;
      }
      .delta {
        margin: 8px 0 0;
        color: var(--muted);
      }
      .note {
        margin-top: 28px;
        max-width: 760px;
        color: var(--muted);
        line-height: 1.7;
      }
      code {
        background: rgba(255, 255, 255, 0.08);
        padding: 2px 6px;
        border-radius: 8px;
      }
    </style>
  </head>
  <body>
    <main>
      <p class="label">localhost only</p>
      <h1>${config.appName}</h1>
      <p class="subtitle">
        Local founder surface for company-only metrics. This app binds to
        <code>127.0.0.1:${config.port}</code> and rejects non-loopback requests before any
        sensitive content is served.
      </p>
      <div class="chips">
        <span class="chip">Health check available</span>
        <span class="chip">Loopback middleware enforced</span>
        <span class="chip">Public app boundary preserved</span>
      </div>
      <section class="grid">
        ${cards}
      </section>
      <p class="note">
        Keep this surface separate from the public school ERP. Founder-only routes are intentionally
        not mounted in the main API and should never be exposed outside localhost.
      </p>
    </main>
  </body>
</html>`;
}

export function createFounderApp() {
  const config = loadFounderConfig();
  const app = express();

  app.disable('x-powered-by');
  app.use(localOnlyMiddleware);

  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        service: 'founder-dashboard',
        host: config.host,
        port: config.port,
        version: config.appVersion,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get('/dashboard', (_req, res) => {
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        metrics,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get('/', (_req, res) => {
    res.type('html').send(renderHomePage(config));
  });

  return { app, config };
}

const { app, config } = createFounderApp();

app.listen(config.port, config.host, () => {
  process.stdout.write(`founder dashboard listening on http://${config.host}:${config.port}\n`);
});

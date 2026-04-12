export type FounderConfig = {
  host: '127.0.0.1';
  port: number;
  appName: string;
  appVersion: string;
};

function parsePort(value: string | undefined): number {
  if (!value) {
    return 3001;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return parsed;
}

export function loadFounderConfig(): FounderConfig {
  return {
    host: '127.0.0.1',
    port: parsePort(process.env.PORT),
    appName: process.env.FOUNDER_APP_NAME ?? 'Founder Control Surface',
    appVersion: process.env.FOUNDER_APP_VERSION ?? '0.1.0',
  };
}

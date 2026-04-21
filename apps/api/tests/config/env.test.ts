import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  applyEnvironmentFiles,
  getEnvironmentSearchDirectories,
  loadSecretFromProcessFileOrWindowsCredential,
  loadSecretFromProcessOrFile,
} from '../../src/config/env.js';

function createTempWorkspace(): { rootDir: string; apiDir: string } {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'school-erp-env-'));
  const apiDir = path.join(rootDir, 'apps', 'api');

  fs.mkdirSync(apiDir, { recursive: true });
  fs.writeFileSync(
    path.join(rootDir, 'package.json'),
    JSON.stringify({ name: 'temp-workspace', private: true, workspaces: ['apps/*'] }, null, 2),
  );

  return { rootDir, apiDir };
}

describe('env file loading', () => {
  it('searches from the repo root down to the current workspace', () => {
    const { rootDir, apiDir } = createTempWorkspace();

    try {
      expect(getEnvironmentSearchDirectories(apiDir)).toEqual([
        rootDir,
        path.join(rootDir, 'apps'),
        apiDir,
      ]);
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('loads env files in root-to-workspace order so later files can override earlier ones', () => {
    const { rootDir, apiDir } = createTempWorkspace();
    const targetEnv: NodeJS.ProcessEnv = {};

    try {
      fs.writeFileSync(path.join(rootDir, '.env'), 'AUTH_MODE=dev\nOWNER_BOOTSTRAP_KEY=root-key\n');
      fs.writeFileSync(path.join(rootDir, '.env.local'), 'OWNER_BOOTSTRAP_KEY=root-local-key\n');
      fs.writeFileSync(path.join(apiDir, '.env.local'), 'AUTH_MODE=jwt\nFIREBASE_PROJECT_ID=workspace-project\n');

      const loadedFiles = applyEnvironmentFiles(apiDir, targetEnv, new Set());

      expect(loadedFiles).toEqual([
        path.join(rootDir, '.env'),
        path.join(rootDir, '.env.local'),
        path.join(apiDir, '.env.local'),
      ]);
      expect(targetEnv.AUTH_MODE).toBe('jwt');
      expect(targetEnv.OWNER_BOOTSTRAP_KEY).toBeUndefined();
      expect(targetEnv.FIREBASE_PROJECT_ID).toBe('workspace-project');
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('preserves environment variables that were already injected by the shell or test harness', () => {
    const { rootDir, apiDir } = createTempWorkspace();
    const targetEnv: NodeJS.ProcessEnv = {
      AUTH_MODE: 'jwt',
    };

    try {
      fs.writeFileSync(path.join(rootDir, '.env'), 'AUTH_MODE=dev\nOWNER_BOOTSTRAP_KEY=root-key\n');

      applyEnvironmentFiles(apiDir, targetEnv, new Set(['AUTH_MODE']));

      expect(targetEnv.AUTH_MODE).toBe('jwt');
      expect(targetEnv.OWNER_BOOTSTRAP_KEY).toBeUndefined();
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('loads the bootstrap key from an explicit file path instead of repo env files', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'school-erp-secret-'));
    const secretPath = path.join(tempDir, 'owner-bootstrap.key');

    try {
      fs.writeFileSync(secretPath, 'file-based-secret\n');

      expect(
        loadSecretFromProcessOrFile('OWNER_BOOTSTRAP_KEY', 'OWNER_BOOTSTRAP_KEY_FILE', {
          OWNER_BOOTSTRAP_KEY_FILE: secretPath,
        }),
      ).toBe('file-based-secret');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('loads the bootstrap key from Windows Credential Manager when a target is configured', () => {
    const spawnStub = jest.fn().mockReturnValue({
      pid: 1234,
      output: [],
      stdout: 'credential-manager-secret\n',
      stderr: '',
      status: 0,
      signal: null,
    } as unknown as ReturnType<typeof childProcess.spawnSync>);

    try {
      expect(
        loadSecretFromProcessFileOrWindowsCredential(
          'OWNER_BOOTSTRAP_KEY',
          'OWNER_BOOTSTRAP_KEY_FILE',
          'OWNER_BOOTSTRAP_KEY_CREDENTIAL_TARGET',
          {
            OWNER_BOOTSTRAP_KEY_CREDENTIAL_TARGET: 'ShardaOS.OwnerBootstrapKey',
          },
          process.cwd(),
          spawnStub,
        ),
      ).toBe('credential-manager-secret');
    } finally {
      expect(spawnStub).toHaveBeenCalled();
    }
  });
});

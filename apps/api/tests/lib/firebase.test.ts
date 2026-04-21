import { resolveFirebaseCredentialSource } from '../../src/lib/firebase.js';

describe('resolveFirebaseCredentialSource', () => {
  it('returns none when Google Application Credentials are not configured', () => {
    expect(resolveFirebaseCredentialSource('')).toEqual({ kind: 'none' });
  });

  it('treats a non-empty non-JSON value as the standard application-default path flow', () => {
    expect(resolveFirebaseCredentialSource('C:\\keys\\service-account.json')).toEqual({
      kind: 'applicationDefault',
    });
  });

  it('parses inline service-account JSON when explicitly provided', () => {
    const source = resolveFirebaseCredentialSource(
      JSON.stringify({
        project_id: 'school-erp-prod',
        client_email: 'firebase-adminsdk@example.iam.gserviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n',
      }),
    );

    expect(source).toEqual({
      kind: 'serviceAccount',
      serviceAccount: {
        project_id: 'school-erp-prod',
        client_email: 'firebase-adminsdk@example.iam.gserviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n',
      },
    });
  });
});

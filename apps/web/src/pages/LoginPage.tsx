import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAppDispatch } from '../store/hooks';
import { setUser } from '../features/auth/authSlice';
import { auth } from '../lib/firebase';
import { saveDevSession } from '../features/auth/AuthInitializer';

const DEV_OWNER_EMAIL = (import.meta.env.VITE_DEV_OWNER_EMAIL ?? 'owner@shardaos.com').toLowerCase();
const DEV_OWNER_PASSWORD = import.meta.env.VITE_DEV_OWNER_PASSWORD ?? 'Owner@12345';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/owner';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (auth) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const tokenResult = await credential.user.getIdTokenResult();
        const claimRole = tokenResult.claims.role ?? tokenResult.claims.custom_role;
        const role = typeof claimRole === 'string' ? claimRole : '';
        if (role !== 'owner') {
          throw new Error('OWNER_ONLY');
        }
        const schoolIdClaim = tokenResult.claims.schoolId;
        const schoolId = typeof schoolIdClaim === 'string' ? schoolIdClaim : '';

        dispatch(
          setUser({
            uid: credential.user.uid,
            email: credential.user.email ?? email,
            role: 'owner',
            schoolId,
          }),
        );

        navigate(from, { replace: true });
        return;
      }

      // Dev fallback for local setup without Firebase config.
      if (import.meta.env.DEV && email.toLowerCase() === DEV_OWNER_EMAIL && password === DEV_OWNER_PASSWORD) {
        const session = { uid: 'dev-owner-001', email: DEV_OWNER_EMAIL, role: 'owner' as const, schoolId: '' };
        saveDevSession(session);
        dispatch(setUser(session));
        navigate('/owner', { replace: true });
        return;
      }

      throw new Error('INVALID_CREDENTIALS');
    } catch {
      setError('Owner sign-in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-6">Owner sign-in</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="admin@school.edu"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        {import.meta.env.DEV && !auth && (
          <p className="mt-4 text-xs text-gray-400 text-center">
            Dev owner login: {DEV_OWNER_EMAIL}
          </p>
        )}
      </div>
    </div>
  );
}

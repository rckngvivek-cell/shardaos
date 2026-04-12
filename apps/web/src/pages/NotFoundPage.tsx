import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-gray-600 mt-4 mb-6">Page not found</p>
      <Link to="/" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
        Back to Dashboard
      </Link>
    </div>
  );
}

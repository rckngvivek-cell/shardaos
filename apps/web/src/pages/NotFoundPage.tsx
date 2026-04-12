import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="page-stack">
      <section className="empty-state">
        <p className="eyebrow">Not found</p>
        <h2>This route does not exist in the public app.</h2>
        <p>Founder-only surfaces remain separate and local-only by design.</p>
        <Link className="button button--primary" to="/">
          Return to dashboard
        </Link>
      </section>
    </div>
  )
}

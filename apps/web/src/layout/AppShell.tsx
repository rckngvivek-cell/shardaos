import { NavLink, Outlet } from "react-router-dom";

const navigation = [
  { to: "/", label: "Dashboard" },
  { to: "/students", label: "Students" },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[32px] bg-slateish p-6 text-white shadow-panel">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-100">
              Riverstone Public School
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight">
              Operations
              <br />
              Control Deck
            </h1>
            <p className="mt-4 text-sm text-slate-200">
              Student operations first. Attendance, fees, exams, and automation land
              in the next slices.
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }: { isActive: boolean }) =>
                  [
                    "block rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-white text-slate-950"
                      : "bg-white/5 text-slate-100 hover:bg-white/10",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-10 rounded-3xl border border-amber-200/30 bg-amber-300/10 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-100">
              Founder isolation
            </p>
            <p className="mt-3 text-sm text-amber-50">
              Sensitive company controls stay on `127.0.0.1:3001` and never belong in
              this app.
            </p>
          </div>
        </aside>

        <main className="rounded-[32px] bg-white/80 p-4 shadow-panel backdrop-blur md:p-8">
          <div className="rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(248,250,252,0.94))] p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

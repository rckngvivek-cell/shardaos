interface KpiCardProps {
  label: string;
  value: string;
  detail: string;
  accent: "blue" | "green" | "gold";
}

const accentClass: Record<KpiCardProps["accent"], string> = {
  blue: "from-brand-500/20 to-brand-700/10 text-brand-900",
  green: "from-emerald-500/20 to-mint text-emerald-950",
  gold: "from-amber-400/25 to-gold text-amber-950",
};

export function KpiCard({ label, value, detail, accent }: KpiCardProps) {
  return (
    <article
      className={`rounded-3xl border border-white/70 bg-gradient-to-br p-6 shadow-panel ${accentClass[accent]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-3 text-sm text-slate-600">{detail}</p>
    </article>
  );
}

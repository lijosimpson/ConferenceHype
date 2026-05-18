import { BarChart3 } from "lucide-react";
import type { AnalyticsSnapshot } from "@/lib/types";

export function AnalyticsPanel({ analytics }: { analytics: AnalyticsSnapshot }) {
  return (
    <section className="border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-gold" />
        <h2 className="text-xl font-black text-ink">Analytics</h2>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label="views" value={analytics.views} />
        <Metric label="clips" value={analytics.clipsCreated} />
        <Metric label="queued" value={analytics.pendingReview} />
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/65">
        Track which desks, source types, and clips pull attention during the
        conference window.
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-paper p-3 text-center">
      <div className="text-2xl font-black text-ink">{value}</div>
      <div className="text-xs font-bold uppercase text-ink/55">{label}</div>
    </div>
  );
}

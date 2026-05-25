import { History } from "lucide-react";
import type { Segment } from "@/lib/types";

function airedTime(segment: Segment) {
  const value = segment.updatedAt ?? segment.approvedAt ?? segment.createdAt;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short"
  }).format(new Date(value));
}

export function AiredHistory({ segments }: { segments: Segment[] }) {
  return (
    <section className="border border-ink/10 bg-white shadow-panel">
      <div className="border-b border-ink/10 p-5">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-broadcast" />
          <h2 className="text-2xl font-black text-ink">Talked about</h2>
        </div>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/60">
          Rendered broadcast items with the timestamp recorded when the segment
          was last updated by the broadcast pipeline.
        </p>
      </div>
      <div className="grid gap-4 p-5">
        {segments.length === 0 ? (
          <div className="border border-dashed border-ink/20 bg-paper/60 p-5">
            <h3 className="text-lg font-black text-ink">
              No talked-about history has been recorded yet
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/65">
              Once the runner marks aired items as rendered, they will appear
              here with timestamps.
            </p>
          </div>
        ) : null}
        {segments.map((segment) => (
          <article key={segment.id} className="border border-ink/10 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-ink px-2 py-1 text-xs font-black uppercase text-white">
                {airedTime(segment)}
              </span>
              <span className="bg-broadcast px-2 py-1 text-xs font-black uppercase text-white">
                {segment.personaName}
              </span>
              <span className="border border-ink/15 px-2 py-1 text-xs font-bold uppercase text-ink/70">
                {segment.contentType.replace(/_/g, " ")}
              </span>
            </div>
            <h3 className="mt-3 text-lg font-black leading-6 text-ink">
              {segment.title}
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/65">
              {segment.summary || segment.script}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

import { Hash, Rss } from "lucide-react";
import type { SourceConfig } from "@/lib/types";
import { monitoredSocialTags } from "@/lib/sources/registry";

export function SourceManager({ sources }: { sources: SourceConfig[] }) {
  return (
    <section className="border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <Rss className="h-5 w-5 text-mint" />
        <h2 className="text-xl font-black text-ink">Source intake</h2>
      </div>
      <div className="mt-4 border border-cyanline/30 bg-cyanline/10 p-4">
        <div className="flex items-center gap-2 text-sm font-black uppercase text-ink">
          <Hash className="h-4 w-4" />
          Audience tag loop
        </div>
        <p className="mt-2 text-sm leading-6 text-ink/70">
          Monitor {monitoredSocialTags.primaryHashtag},{" "}
          {monitoredSocialTags.secondaryHashtag}, and{" "}
          {monitoredSocialTags.botHandle}. Tagged posts enter the queue as
          social buzz and require human review before airing.
        </p>
      </div>
      <div className="mt-4 grid gap-2">
        {sources.map((source) => (
          <div
            key={source.id}
            className="flex items-center justify-between gap-4 border border-ink/10 p-3"
          >
            <div>
              <div className="text-sm font-black text-ink">{source.name}</div>
              <div className="text-xs font-bold uppercase text-ink/50">
                {source.type} · tier {source.rank}
              </div>
            </div>
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold uppercase text-ink">
              {source.enabled ? "on" : "off"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

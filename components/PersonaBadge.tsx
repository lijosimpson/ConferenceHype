import type { Persona } from "@/lib/types";

export function PersonaBadge({ persona }: { persona: Persona }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-ink/10 bg-white/80 p-4">
      <div>
        <div className="font-black text-ink">{persona.name}</div>
        <div className="text-sm font-semibold text-ink/60">
          {persona.specialty}
        </div>
      </div>
      <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase text-white">
        {persona.voiceGender}
      </span>
    </div>
  );
}

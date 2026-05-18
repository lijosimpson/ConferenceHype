"use client";

import { ShieldAlert } from "lucide-react";
import { useState, useTransition } from "react";
import type { StreamState } from "@/lib/types";

export function EmergencyOverride({ streamState }: { streamState: StreamState }) {
  const [active, setActive] = useState(streamState.emergencyActive);
  const [message, setMessage] = useState(streamState.emergencyMessage);
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const response = await fetch("/api/admin/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active, message })
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
    });
  };

  return (
    <section className="border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-broadcast" />
        <h2 className="text-xl font-black text-ink">Emergency override</h2>
      </div>
      <label className="mt-4 flex items-center gap-3 text-sm font-bold text-ink">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
        Pause automation and play fallback message
      </label>
      <textarea
        className="mt-3 min-h-24 w-full border border-ink/20 p-3 text-sm outline-none focus:border-broadcast"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <button
        className="mt-3 w-full bg-broadcast px-4 py-3 text-sm font-black uppercase text-white disabled:opacity-50"
        disabled={pending}
        onClick={save}
      >
        Save override
      </button>
    </section>
  );
}

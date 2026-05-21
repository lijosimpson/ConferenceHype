"use client";

import { AtSign, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { monitoredXVoices } from "@/lib/sources/registry";

function handleToUrl(handle: string) {
  return `https://x.com/${handle.replace(/^@/, "")}`;
}

async function focusXVoice({
  handle,
  label,
  note
}: {
  handle: string;
  label: string;
  note: string;
}) {
  const response = await fetch("/api/admin/focus-social", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      postUrl: handleToUrl(handle),
      postText: `${label} ${handle} is a watched X voice for ASCO Hype commentary ideas.`,
      operatorNote: `${note}. Treat this as a source callout idea that requires human review before broadcast.`
    })
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error ?? "Could not focus this X voice.");
  }
  return payload as { segment?: { title?: string } };
}

export function XVoiceCallouts() {
  const [message, setMessage] = useState("");
  const [activeHandle, setActiveHandle] = useState("");
  const [pending, startTransition] = useTransition();

  const run = (voice: (typeof monitoredXVoices)[number]) => {
    setActiveHandle(voice.handle);
    startTransition(async () => {
      try {
        const result = await focusXVoice(voice);
        setMessage(
          `${result.segment?.title ?? voice.handle} added to review queue. Refresh admin to review.`
        );
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not focus this X voice.");
      } finally {
        setActiveHandle("");
      }
    });
  };

  return (
    <section className="border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <AtSign className="h-5 w-5 text-broadcast" />
        <h2 className="text-xl font-black text-ink">X voices to call out</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        Watch these voices for commentary ideas. A focus action creates a
        pending review item before anything airs.
      </p>
      {message ? (
        <div className="mt-3 border border-cyanline/30 bg-cyanline/10 p-3 text-sm font-bold text-ink">
          {message}
        </div>
      ) : null}
      <div className="mt-4 grid gap-3">
        {monitoredXVoices.map((voice) => (
          <div key={voice.handle} className="border border-ink/10 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-black text-ink">
                  {voice.label} <span className="text-broadcast">{voice.handle}</span>
                </div>
                <div className="mt-1 text-xs font-bold uppercase text-ink/50">
                  {voice.note}
                </div>
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 bg-ink px-3 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
                disabled={pending}
                onClick={() => run(voice)}
              >
                <Send className="h-3 w-3" />
                {pending && activeHandle === voice.handle ? "Focusing" : "Focus"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { Clock3, Music2, Trash2, Mic2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { buildBroadcastHourBuckets, buildBroadcastSlots } from "@/lib/rundown/slots";
import type { Segment } from "@/lib/types";

async function rejectSegment(segment: Segment) {
  const response = await fetch("/api/admin/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      segmentId: segment.id,
      action: "reject",
      script: segment.script
    })
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

function timeLabel(value?: string) {
  if (!value) {
    return "queued";
  }
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(value));
}

export function BroadcastRundown({
  segments,
  scheduleSegments,
  baseTime
}: {
  segments: Segment[];
  scheduleSegments: Segment[];
  baseTime: string;
}) {
  const router = useRouter();
  const [visibleSegments, setVisibleSegments] = useState(segments);
  const [message, setMessage] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [pending, startTransition] = useTransition();
  const baseDate = useMemo(() => new Date(baseTime), [baseTime]);
  const buckets = useMemo(
    () =>
      buildBroadcastHourBuckets(
        buildBroadcastSlots({
          segments: visibleSegments,
          scheduleSegments,
          baseTime: baseDate
        }),
        baseDate
      ),
    [visibleSegments, scheduleSegments, baseDate]
  );

  useEffect(() => {
    setVisibleSegments(segments);
  }, [segments]);

  const reject = (segment: Segment) => {
    setPendingId(segment.id);
    startTransition(async () => {
      try {
        await rejectSegment(segment);
        setVisibleSegments((current) => current.filter((item) => item.id !== segment.id));
        setMessage(`${segment.title} rejected and removed from rundown.`);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not reject statement.");
      } finally {
        setPendingId("");
      }
    });
  };

  return (
    <section className="border border-ink/10 bg-white shadow-panel">
      <div className="border-b border-ink/10 p-5">
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-broadcast" />
          <h2 className="text-2xl font-black text-ink">Next 3 hours rundown</h2>
        </div>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/60">
          Official schedule/location rundowns every 10 minutes, music space
          every 5 minutes, and approved voice statements with two backups per
          hour.
        </p>
        {message ? (
          <div className="mt-3 border border-cyanline/30 bg-cyanline/10 p-3 text-sm font-bold text-ink">
            {message}
          </div>
        ) : null}
      </div>
      <div className="grid gap-4 p-5">
        {visibleSegments.length === 0 && scheduleSegments.length === 0 ? (
          <div className="border border-dashed border-ink/20 bg-paper/60 p-5">
            <h3 className="text-lg font-black text-ink">
              Nothing is queued for the next 3 hours
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/65">
              Approve segments or run generation to load the next-hour rundown.
            </p>
          </div>
        ) : null}
        {buckets.map((bucket, hourIndex) => (
          <article key={bucket.start.toISOString()} className="border border-ink/10 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Clock3 className="h-4 w-4 text-broadcast" />
              <h3 className="text-lg font-black text-ink">
                Hour {hourIndex + 1}: {timeLabel(bucket.start.toISOString())}
              </h3>
              <span className="ml-auto bg-ink px-2 py-1 text-xs font-black uppercase text-white">
                {bucket.slots.filter((slot) => slot.kind === "statement" || slot.kind === "backup").length} voice cards
              </span>
            </div>
            <div className="mt-3 grid gap-3">
              {bucket.slots.map((slot, index) => (
                <div
                  key={`${slot.kind}-${slot.segment?.id ?? slot.at.toISOString()}-${index}`}
                  className={`p-3 ${
                    slot.kind === "music"
                      ? "border border-dashed border-ink/20 bg-white"
                      : slot.kind === "backup"
                        ? "border border-gold/50 bg-gold/10"
                        : "bg-paper"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-1 text-[11px] font-black uppercase text-white ${slot.kind === "music" ? "bg-ink/60" : slot.kind === "backup" ? "bg-gold text-ink" : "bg-broadcast"}`}>
                      {slot.kind}
                    </span>
                    <span className="text-xs font-bold text-ink/50">
                      {timeLabel(slot.at.toISOString())}
                    </span>
                    {slot.segment?.personaName ? (
                      <span className="inline-flex items-center gap-1 border border-ink/15 bg-white px-2 py-1 text-[11px] font-bold uppercase text-ink/70">
                        <Mic2 className="h-3 w-3" />
                        {slot.segment.personaName}
                      </span>
                    ) : null}
                    {slot.segment?.contentType ? (
                      <span className="border border-ink/15 bg-white px-2 py-1 text-[11px] font-bold uppercase text-ink/70">
                        {slot.segment.contentType === "industry_floor"
                          ? "exhibitor chatter"
                          : slot.segment.contentType === "abstract_buzz"
                            ? "abstract chatter"
                            : slot.segment.contentType.replace(/_/g, " ")}
                      </span>
                    ) : null}
                  </div>
                  {slot.kind === "music" ? (
                    <div className="mt-2 flex items-center gap-2 text-xs font-black uppercase text-ink/50">
                      <Music2 className="h-4 w-4" />
                      Leave open for music
                    </div>
                  ) : (
                    <>
                      <div className="mt-2 flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black leading-5 text-ink">
                            {slot.segment?.title ?? slot.label}
                          </h4>
                          <p className="mt-1 text-xs font-semibold leading-5 text-ink/65">
                            {slot.segment?.summary || slot.segment?.script}
                          </p>
                        </div>
                        {slot.segment && !slot.segment.id.startsWith("virtual-") ? (
                          <button
                            className="inline-flex items-center gap-1 border border-ink px-2 py-2 text-[11px] font-black uppercase text-ink disabled:opacity-50"
                            disabled={pending}
                            onClick={() => reject(slot.segment!)}
                          >
                            <Trash2 className="h-3 w-3" />
                            {pendingId === slot.segment.id ? "Rejecting" : "Reject"}
                          </button>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

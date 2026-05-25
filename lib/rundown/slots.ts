import type { Segment } from "@/lib/types";

export type BroadcastSlot = {
  at: Date;
  kind: "music" | "schedule" | "statement" | "backup";
  segment?: Segment;
  label: string;
};

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function firstSlotTime(segment: Segment) {
  return new Date(segment.approvedAt ?? segment.createdAt);
}

function placeStatements(segments: Segment[], baseTime: Date, hours: number) {
  const end = addMinutes(baseTime, hours * 60);
  const sorted = [...segments].sort(
    (a, b) => firstSlotTime(a).getTime() - firstSlotTime(b).getTime()
  );
  const scheduled: BroadcastSlot[] = [];
  const floating: Segment[] = [];

  for (const segment of sorted) {
    const slotTime = firstSlotTime(segment);
    if (slotTime >= baseTime && slotTime < end) {
      scheduled.push({
        at: slotTime,
        kind: "statement",
        label: segment.personaName || "Voice statement",
        segment
      });
      continue;
    }
    if (slotTime < baseTime) {
      floating.push(segment);
    }
  }

  const usedTimes = new Set(scheduled.map((slot) => slot.at.getTime()));
  const placedFloating: BroadcastSlot[] = [];
  for (const [index, segment] of floating.entries()) {
    let at = addMinutes(baseTime, 2 + index * 12);
    while (usedTimes.has(at.getTime())) {
      at = addMinutes(at, 1);
    }
    if (at >= end) {
      break;
    }
    usedTimes.add(at.getTime());
    placedFloating.push({
      at,
      kind: "statement",
      label: segment.personaName || "Voice statement",
      segment
    });
  }

  return [...scheduled, ...placedFloating];
}

export function buildBroadcastSlots({
  segments,
  scheduleSegments,
  baseTime,
  hours = 3
}: {
  segments: Segment[];
  scheduleSegments: Segment[];
  baseTime: Date;
  hours?: number;
}) {
  const end = addMinutes(baseTime, hours * 60);
  const slots: BroadcastSlot[] = [];

  for (let minute = 0; minute < hours * 60; minute += 5) {
    slots.push({
      at: addMinutes(baseTime, minute),
      kind: "music",
      label: "Music bed / transition space"
    });
  }

  for (const segment of scheduleSegments) {
    const slotTime = firstSlotTime(segment);
    if (slotTime >= baseTime && slotTime < end) {
      slots.push({
        at: slotTime,
        kind: "schedule",
        label: "10-minute session/location rundown",
        segment
      });
    }
  }

  return [...slots, ...placeStatements(segments, baseTime, hours)].sort(
    (a, b) => a.at.getTime() - b.at.getTime()
  );
}

export function buildBroadcastHourBuckets(slots: BroadcastSlot[], baseTime: Date, hours = 3) {
  return Array.from({ length: hours }, (_, hourIndex) => {
    const start = addMinutes(baseTime, hourIndex * 60);
    const end = addMinutes(start, 60);
    const hourSlots = slots.filter((slot) => slot.at >= start && slot.at < end);
    const statements = hourSlots.filter((slot) => slot.kind === "statement");
    const primaryStatementIds = new Set(
      statements.length > 2
        ? statements.slice(0, statements.length - 2).map((slot) => slot.segment?.id)
        : statements.map((slot) => slot.segment?.id)
    );
    return {
      start,
      end,
      slots: hourSlots.map((slot) =>
        slot.kind === "statement" && !primaryStatementIds.has(slot.segment?.id)
          ? { ...slot, kind: "backup" as const, label: `${slot.label} backup` }
          : slot
      )
    };
  });
}

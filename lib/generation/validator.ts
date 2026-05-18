import type { Segment } from "@/lib/types";
import { defaultDisclaimer } from "./disclaimers";

const bannedAdvicePatterns = [
  /\bpatients should\b/i,
  /\bclinicians should\b/i,
  /\bdoctors should\b/i,
  /\bbuy\b/i,
  /\bsell\b/i,
  /\bhold\b/i,
  /\bwill move\b/i,
  /\bguaranteed\b/i
];

export function validateSegmentForApproval(segment: Pick<Segment, "script" | "citations" | "contentType">) {
  const errors: string[] = [];
  if (!segment.script.includes(defaultDisclaimer)) {
    errors.push("Missing required ASCO Hype disclaimer.");
  }
  if (segment.citations.length === 0) {
    errors.push("At least one citation is required before approval.");
  }
  for (const pattern of bannedAdvicePatterns) {
    if (pattern.test(segment.script)) {
      errors.push(`Script contains disallowed advice language: ${pattern}`);
    }
  }
  if (
    segment.contentType === "social_signal" &&
    !/\b(posted|claimed|reacted|discussed|social buzz|unverified)\b/i.test(segment.script)
  ) {
    errors.push("Social signal scripts must be labeled as buzz or attributed posts.");
  }
  return errors;
}

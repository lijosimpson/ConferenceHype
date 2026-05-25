import type { Segment } from "@/lib/types";
import { getUnsafeReviewSourceErrors } from "@/lib/generation/sourceSafety";

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

export function validateSegmentForApproval(segment: Pick<Segment, "title" | "summary" | "script" | "citations" | "contentType">) {
  const errors: string[] = [];
  if (segment.citations.length === 0) {
    errors.push("At least one citation is required before approval.");
  }
  errors.push(...getUnsafeReviewSourceErrors(segment));
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

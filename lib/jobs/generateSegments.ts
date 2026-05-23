import { randomUUID } from "node:crypto";
import { generateSegmentFromSources } from "@/lib/generation/llm";
import { runIngestionJob } from "@/lib/jobs/ingest";
import { buildScheduleFallbackSegment } from "@/lib/jobs/upcomingEvents";
import { getXFollowVoicesFromDb, saveGeneratedSegmentsToDb } from "@/lib/db";
import {
  buildSocialVoiceCompetitionSegment,
  buildSocialVoiceLeaderboard,
  shouldRunSocialVoiceCompetition
} from "@/lib/social/leaderboard";
import type { Segment } from "@/lib/types";

async function generateOrScheduleFallback(
  generate: () => Promise<Segment>,
  now: Date
) {
  try {
    return await generate();
  } catch {
    return {
      ...buildScheduleFallbackSegment(now),
      id: `schedule-fallback-${randomUUID()}`,
      title: "Schedule fallback: ASCO program spine",
      summary:
        "LLM script generation did not produce a usable real script, so broadcast defaults to the official ASCO schedule spine with no mock data."
    };
  }
}

function dedupeScheduleFallbacks(segments: Segment[]) {
  let scheduleFallbackSeen = false;
  return segments.filter((segment) => {
    const isScheduleFallback = segment.riskFlags.includes("no_llm_schedule_spine");
    if (!isScheduleFallback) {
      return true;
    }
    if (scheduleFallbackSeen) {
      return false;
    }
    scheduleFallbackSeen = true;
    return true;
  });
}

export async function runGenerateJob() {
  const now = new Date();
  const items = await runIngestionJob();
  const socialItems = items.filter((item) => item.sourceType.includes("social"));
  const primaryItems = items.filter((item) => !item.sourceType.includes("social"));

  const generatedSegments = dedupeScheduleFallbacks(
    await Promise.all([
      generateOrScheduleFallback(
        () =>
          generateSegmentFromSources({
            sources: primaryItems.slice(0, 8),
            personaId: "echo-sage",
            hypeLevel: "standard"
          }),
        now
      ),
      generateOrScheduleFallback(
        () =>
          generateSegmentFromSources({
            sources: socialItems.slice(0, 8),
            personaId: "vesper-quill",
            hypeLevel: "high_energy",
            editorialInstruction:
              "Treat #ASCOHype, #AskASCOHype, #ASCO26, @ASCOHypeAI, and monitored X voice posts as audience buzz that requires review. Use #ASCO26 and watched X voices for commentary ideas and topic discovery, but do not treat them as verified fact. If a watched X voice is useful, call out the handle and source name clearly. If posts recommend snacks or coffee in the Exhibitor Hall, frame them as attendee tips, not endorsements, and remind listeners that availability and locations can change."
          }),
        now
      )
    ])
  );

  const customVoices = (await getXFollowVoicesFromDb()) ?? [];
  const leaderboard = buildSocialVoiceLeaderboard(socialItems, customVoices);
  const competitionSegment = shouldRunSocialVoiceCompetition()
    ? [buildSocialVoiceCompetitionSegment(leaderboard)]
    : [];
  const segments = [...generatedSegments, ...competitionSegment];
  await saveGeneratedSegmentsToDb(segments);
  return segments;
}

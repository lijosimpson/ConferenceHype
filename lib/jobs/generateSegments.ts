import { randomUUID } from "node:crypto";
import { generateSegmentFromSources } from "@/lib/generation/llm";
import { runIngestionJob } from "@/lib/jobs/ingest";
import { buildScheduleFallbackSegment } from "@/lib/jobs/upcomingEvents";
import {
  addXFollowSourceToDb,
  getXFollowVoicesFromDb,
  saveGeneratedSegmentsToDb
} from "@/lib/db";
import {
  buildSocialVoiceCompetitionSegment,
  buildSocialVoiceLeaderboard,
  shouldRunSocialVoiceCompetition
} from "@/lib/social/leaderboard";
import type { IngestedItem, Segment, SocialVoiceLeader } from "@/lib/types";

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

async function generateOrNull(generate: () => Promise<Segment>) {
  try {
    return await generate();
  } catch {
    return null;
  }
}

function isXVoiceCallout(item: IngestedItem) {
  return (
    item.sourceName === "X voice monitor" ||
    item.title.toLowerCase().startsWith("monitored x voice:")
  );
}

function itemText(item: IngestedItem) {
  return `${item.title}\n${item.excerpt}\n${item.sourceName}`.toLowerCase();
}

function isExhibitorChatter(item: IngestedItem) {
  const text = itemText(item);
  return /\b(exhibitor|exhibit hall|booth|sponsor|product showcase|industry floor|company showcase|commercial|demo|showcase)\b/i.test(
    text
  );
}

function isAbstractChatter(item: IngestedItem) {
  const text = itemText(item);
  return /\b(abstract|oral|poster|trial|phase\s?[123]|orr|pfs|os|mrd|ctdna|biomarker|nsclc|breast cancer|prostate|myeloma|lymphoma|data|results)\b/i.test(
    text
  );
}

async function addCompetitionLeadersToXCallouts(leaders: SocialVoiceLeader[]) {
  await Promise.all(
    leaders.slice(0, 3).map((leader) =>
      addXFollowSourceToDb({
        handle: leader.handle,
        label: leader.label,
        note: `social voice competition winner; ${leader.momentum} momentum`
      })
    )
  );
}

export async function runGenerateJob() {
  const now = new Date();
  const items = await runIngestionJob();
  const socialItems = items.filter((item) => item.sourceType.includes("social"));
  const xVoiceItems = socialItems.filter(isXVoiceCallout);
  const reviewSocialItems = socialItems.filter((item) => !isXVoiceCallout(item));
  const primaryItems = items.filter((item) => !item.sourceType.includes("social"));
  const abstractSources = [...primaryItems, ...xVoiceItems].filter(isAbstractChatter);
  const exhibitorSources = [...primaryItems, ...xVoiceItems].filter(isExhibitorChatter);
  const otherXVoiceItems = xVoiceItems.filter(
    (item) => !isAbstractChatter(item) && !isExhibitorChatter(item)
  );
  const otherReviewSocialItems = reviewSocialItems.filter(
    (item) => !isAbstractChatter(item) && !isExhibitorChatter(item)
  );
  const otherPrimarySources = primaryItems.filter(
    (item) => !isAbstractChatter(item) && !isExhibitorChatter(item)
  );

  const generatedSegments = dedupeScheduleFallbacks(
    (
      await Promise.all([
      generateOrScheduleFallback(
        () =>
          generateSegmentFromSources({
            sources: (abstractSources.length ? abstractSources : otherPrimarySources).slice(0, 8),
            personaId: "echo-sage",
            hypeLevel: "standard",
            contentType: abstractSources.length ? "abstract_buzz" : "media_roundup",
            editorialInstruction: abstractSources.length
              ? "Create an abstract/science chatter segment only. Focus on abstracts, trials, posters, data, biomarkers, disease tracks, presenters, and source-attributed scientific discussion. Do not include exhibitor booths, sponsor copy, product-floor chatter, or commercial showcases."
              : "Create a media/source roundup segment only. Do not mix in exhibitor booths, sponsor copy, product-floor chatter, or commercial showcases."
          }),
        now
      ),
      exhibitorSources.length
        ? generateOrNull(() =>
            generateSegmentFromSources({
              sources: exhibitorSources.slice(0, 8),
              personaId: "vesper-quill",
              hypeLevel: "high_energy",
              contentType: "industry_floor",
              status: xVoiceItems.some((item) => exhibitorSources.includes(item))
                ? "approved"
                : "pending_review",
              editorialInstruction:
                "Create an exhibitor/floor chatter segment only. Focus on booths, exhibitor hall items, sponsor messages, product showcases, company floor activity, and operator/source-attributed industry-floor notes. Do not include abstract data, oral abstract results, poster science, trial endpoints, or disease-track data interpretation."
            })
          )
        : Promise.resolve(null),
      otherXVoiceItems.length || otherReviewSocialItems.length
        ? generateOrNull(() =>
            generateSegmentFromSources({
              sources: otherXVoiceItems.length
                ? otherXVoiceItems.slice(0, 8)
                : otherReviewSocialItems.slice(0, 8),
              personaId: "vesper-quill",
              hypeLevel: "high_energy",
              status: otherXVoiceItems.length ? "approved" : "pending_review",
              editorialInstruction:
                otherXVoiceItems.length
                  ? "This is a monitored X voice callout segment for non-abstract, non-exhibitor items only. It may broadcast without manual approval when source-attributed. Call out the handle and source name clearly, narrate the material directly, and avoid full disclaimer repetition. Do not include abstract data or exhibitor/floor chatter in this segment."
                  : "Do not create broadcast material from vague non-monitored audience chatter, snack tips, hallway energy, or unverified social buzz. Use only source-attributed material from a monitored X voice, official schedule/session data, an article/media source, an operator statement, or a sponsor message. If the input is only an unverified audience tip, produce a review-only note that should not be used in the broadcast rundown."
            })
          )
        : Promise.resolve(null)
      ])
    ).filter((segment): segment is Segment => Boolean(segment))
  );

  const customVoices = (await getXFollowVoicesFromDb()) ?? [];
  const leaderboard = buildSocialVoiceLeaderboard(socialItems, customVoices);
  const competitionDueNow = shouldRunSocialVoiceCompetition();
  if (competitionDueNow) {
    await addCompetitionLeadersToXCallouts(leaderboard);
  }
  const competitionSegment = competitionDueNow
    ? [buildSocialVoiceCompetitionSegment(leaderboard)]
    : [];
  const segments = [...generatedSegments, ...competitionSegment];
  await saveGeneratedSegmentsToDb(segments);
  return segments;
}

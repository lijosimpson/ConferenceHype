import { sourceRegistry } from "@/lib/sources/registry";
import {
  buildScheduleFallbackSegment,
  buildScheduleRundownSegments
} from "@/lib/jobs/upcomingEvents";
import {
  getAnalyticsFromDb,
  getAiredSegmentsFromDb,
  getApprovedSegmentsFromDb,
  getNextBroadcastSegmentsFromDb,
  getPendingSegmentsFromDb,
  getRecentSocialItemsFromDb,
  getSourcesFromDb,
  getStreamStateFromDb,
  getXFollowVoicesFromDb
} from "@/lib/db";
import {
  buildSocialVoiceLeaderboard,
  shouldRunSocialVoiceCompetition
} from "@/lib/social/leaderboard";
import type { AnalyticsSnapshot, StreamState } from "@/lib/types";

function isUnsafeForBroadcastRundown(scriptish: string) {
  return /\b(early social chatter|unverified buzz|operator-selected audience tip|audience tip|snack|coffee|hallway energy|rising energy|pending review)\b/i.test(
    scriptish
  );
}

function hasVerifiedBroadcastSource(segment: { script: string; summary: string; citations: { sourceType: string }[]; contentType: string }) {
  if (segment.contentType === "agenda_preview" || segment.contentType === "industry_floor") {
    return true;
  }
  return segment.citations.some((citation) =>
    ["official", "media", "verified_social", "company"].includes(citation.sourceType)
  );
}

function filterBroadcastReadySegments<T extends { script: string; summary: string; citations: { sourceType: string }[]; contentType: string }>(
  segments: T[]
) {
  return segments.filter((segment) => {
    const text = `${segment.summary}\n${segment.script}`;
    return !isUnsafeForBroadcastRundown(text) && hasVerifiedBroadcastSource(segment);
  });
}

export async function getPublicSegments() {
  const dbSegments = await getApprovedSegmentsFromDb();
  return dbSegments?.length ? dbSegments : [buildScheduleFallbackSegment()];
}

export async function getStreamState(): Promise<StreamState> {
  const dbStreamState = await getStreamStateFromDb();
  if (dbStreamState) {
    return dbStreamState;
  }
  return {
    mode: process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_ID
      ? "youtube_primary"
      : process.env.NEXT_PUBLIC_HLS_URL
        ? "hls_fallback"
        : "preview",
    emergencyActive: false,
    emergencyMessage:
      "ASCO Hype automation is paused while the operator desk reviews the queue.",
    currentSegmentId: undefined
  };
}

export async function getAdminSnapshot() {
  const xFollowVoices = (await getXFollowVoicesFromDb()) ?? [];
  const recentSocialItems = (await getRecentSocialItemsFromDb(3)) ?? [];
  const socialVoiceLeaderboard = buildSocialVoiceLeaderboard(
    recentSocialItems,
    xFollowVoices
  );
  const pendingSegments = filterBroadcastReadySegments(
    (await getPendingSegmentsFromDb()) ?? []
  );
  const nextBroadcastSegments = filterBroadcastReadySegments(
    (await getNextBroadcastSegmentsFromDb()) ?? []
  );
  const scheduleRundownSegments = buildScheduleRundownSegments();
  const airedSegments = (await getAiredSegmentsFromDb()) ?? [];
  const analytics: AnalyticsSnapshot = (await getAnalyticsFromDb()) ?? {
    views: 128,
    clipsCreated: 4,
    pendingReview: pendingSegments.length
  };
  return {
    pendingSegments,
    nextBroadcastSegments,
    scheduleRundownSegments,
    airedSegments,
    streamState: await getStreamState(),
    sources: (await getSourcesFromDb()) ?? sourceRegistry,
    xFollowVoices,
    socialVoiceLeaderboard,
    nextSocialVoiceCompetition:
      "Runs from the generation job during every third UTC hour.",
    socialVoiceCompetitionDueNow: shouldRunSocialVoiceCompetition(),
    analytics
  };
}

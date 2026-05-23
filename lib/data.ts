import { sourceRegistry } from "@/lib/sources/registry";
import { buildScheduleFallbackSegment } from "@/lib/jobs/upcomingEvents";
import {
  getAnalyticsFromDb,
  getApprovedSegmentsFromDb,
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
  const pendingSegments = (await getPendingSegmentsFromDb()) ?? [];
  const analytics: AnalyticsSnapshot = (await getAnalyticsFromDb()) ?? {
    views: 128,
    clipsCreated: 4,
    pendingReview: pendingSegments.length
  };
  return {
    pendingSegments,
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

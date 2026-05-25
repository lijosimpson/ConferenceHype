import { AdminShell } from "@/components/AdminShell";
import { AdminTabs } from "@/components/AdminTabs";
import { AiredHistory } from "@/components/AiredHistory";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { BroadcastRundown } from "@/components/BroadcastRundown";
import { EmergencyOverride } from "@/components/EmergencyOverride";
import { FocusSocialPost } from "@/components/FocusSocialPost";
import { InstagramPushPanel } from "@/components/InstagramPushPanel";
import { LanguageControls } from "@/components/LanguageControls";
import { OncologyReporterGrid } from "@/components/OncologyReporterGrid";
import { RecordingLibrary } from "@/components/RecordingLibrary";
import { ReviewQueue } from "@/components/ReviewQueue";
import { SocialVoiceCompetition } from "@/components/SocialVoiceCompetition";
import { SourceManager } from "@/components/SourceManager";
import { XVoiceCallouts } from "@/components/XVoiceCallouts";
import { getAdminSnapshot } from "@/lib/data";
import { getCachedRecordings } from "@/lib/media/recordings";

export default async function AdminPage() {
  const [snapshot, cachedRecordings] = await Promise.all([
    getAdminSnapshot(),
    getCachedRecordings()
  ]);
  const baseTime = new Date().toISOString();

  return (
    <AdminShell>
      <AdminTabs
        broadcast={
          <div className="grid gap-6 xl:grid-cols-2">
            <BroadcastRundown
              segments={snapshot.nextBroadcastSegments}
              scheduleSegments={snapshot.scheduleRundownSegments}
              baseTime={baseTime}
            />
            <div className="grid gap-6">
              <ReviewQueue segments={snapshot.pendingSegments} />
              <FocusSocialPost />
              <InstagramPushPanel />
              <EmergencyOverride streamState={snapshot.streamState} />
              <SourceManager sources={snapshot.sources} />
              <AnalyticsPanel analytics={snapshot.analytics} />
            </div>
          </div>
        }
        history={<AiredHistory segments={snapshot.airedSegments} />}
        voices={
          <div className="grid gap-6 xl:grid-cols-2">
            <RecordingLibrary recordings={cachedRecordings} />
            <OncologyReporterGrid />
            <XVoiceCallouts customVoices={snapshot.xFollowVoices} />
            <SocialVoiceCompetition
              leaders={snapshot.socialVoiceLeaderboard}
              cadence={snapshot.nextSocialVoiceCompetition}
              dueNow={snapshot.socialVoiceCompetitionDueNow}
            />
            <LanguageControls />
          </div>
        }
      />
    </AdminShell>
  );
}

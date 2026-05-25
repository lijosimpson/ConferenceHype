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

type AdminPageProps = {
  searchParams?: Promise<{ start?: string }>;
};

function getEasternDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: value("year"),
    month: value("month"),
    day: value("day")
  };
}

function todayAtNoonEastern(now = new Date()) {
  const { year, month, day } = getEasternDateParts(now);
  return new Date(`${year}-${month}-${day}T12:00:00-04:00`);
}

function resolvePreviewStart(start?: string) {
  if (!start) {
    return new Date();
  }
  if (start === "today-noon") {
    return todayAtNoonEastern();
  }
  const parsed = new Date(start);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const baseDate = resolvePreviewStart(params?.start);
  const [snapshot, cachedRecordings] = await Promise.all([
    getAdminSnapshot(baseDate),
    getCachedRecordings()
  ]);
  const baseTime = baseDate.toISOString();
  const noonPreviewHref = "/admin?start=today-noon";
  const liveHref = "/admin";
  const previewLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(baseDate);

  return (
    <AdminShell>
      <div className="mb-5 flex flex-wrap items-center gap-3 border border-ink/10 bg-white p-4 shadow-panel">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-black uppercase text-broadcast">
            Rundown preview start
          </div>
          <div className="text-lg font-black text-ink">{previewLabel}</div>
        </div>
        <a
          className="inline-flex min-h-10 items-center justify-center border border-ink bg-white px-4 text-xs font-black uppercase text-ink"
          href={noonPreviewHref}
        >
          Today noon preview
        </a>
        <a
          className="inline-flex min-h-10 items-center justify-center bg-ink px-4 text-xs font-black uppercase text-white"
          href={liveHref}
        >
          Live now view
        </a>
      </div>
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

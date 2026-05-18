import { Radio, ShieldAlert, Tv } from "lucide-react";
import type { Segment, StreamState } from "@/lib/types";

type Props = {
  streamState: StreamState;
  currentSegment?: Segment;
};

export function PublicPlayer({ streamState, currentSegment }: Props) {
  const youtubeId = process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_ID;
  const hlsUrl = process.env.NEXT_PUBLIC_HLS_URL;

  return (
    <div className="border border-ink/15 bg-white shadow-panel">
      <div className="flex items-center justify-between border-b border-ink/10 p-4">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-broadcast" />
          <span className="font-black uppercase tracking-wide">
            Live desk monitor
          </span>
        </div>
        <span className="rounded-full bg-mint px-3 py-1 text-xs font-black uppercase text-white">
          {streamState.mode}
        </span>
      </div>

      <div className="aspect-video bg-ink">
        {streamState.emergencyActive ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-white">
            <ShieldAlert className="h-12 w-12 text-gold" />
            <h2 className="text-2xl font-black">Emergency override active</h2>
            <p className="max-w-md text-sm text-white/75">
              The automated stream is paused while operators review the current
              queue.
            </p>
          </div>
        ) : youtubeId ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1`}
            title="ASCO Hype live stream"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : hlsUrl ? (
          <video className="h-full w-full" controls playsInline src={hlsUrl} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-white">
            <Tv className="h-12 w-12 text-cyanline" />
            <h2 className="text-2xl font-black">Stream preview mode</h2>
            <p className="max-w-md text-sm text-white/75">
              Add YouTube or HLS environment variables after deployment to turn
              on the live player.
            </p>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="text-xs font-black uppercase tracking-wide text-broadcast">
          Current topic
        </div>
        <h3 className="mt-1 text-xl font-black text-ink">
          {currentSegment?.title ?? "Awaiting first live topic"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-ink/70">
          {currentSegment?.summary ??
            "Commentary topics will appear here as the stream comes online."}
        </p>
      </div>
    </div>
  );
}

import { env } from "@/lib/env";

export function getYoutubeRtmpTarget() {
  if (!env.YOUTUBE_RTMP_URL || !env.YOUTUBE_STREAM_KEY) {
    throw new Error("Missing YouTube RTMP URL or stream key.");
  }
  return `${env.YOUTUBE_RTMP_URL}/${env.YOUTUBE_STREAM_KEY}`;
}

import { createClipJobInDb } from "@/lib/db";

export async function createClipJob(segmentId: string, script: string) {
  const candidate = script
    .split(/\n+/)
    .find((line) => line.length > 80 && line.length < 500);
  const dbJob = await createClipJobInDb(segmentId, candidate ?? script.slice(0, 280));
  if (dbJob) {
    return dbJob;
  }
  return {
    id: `clip-${segmentId}-${Date.now()}`,
    segmentId,
    durationSeconds: 45,
    format: "vertical_1080x1920",
    status: "queued",
    hook:
      "Worker uses FFmpeg to render 30-60 second clips from approved segment audio/video.",
    excerpt: candidate ?? script.slice(0, 280)
  };
}

import { buildSegmentRenderCommand, runCommand } from "@/lib/media/ffmpeg";

async function main() {
  const voicePath = process.env.VOICE_AUDIO_PATH ?? "public/placeholders/sample-voice.wav";
  const musicPath = process.env.MUSIC_AUDIO_PATH ?? "public/music/light-jazz-techno.mp3";
  const outputPath = process.env.RENDER_OUTPUT_PATH ?? "public/rendered/sample-segment.m4a";
  const command = buildSegmentRenderCommand({ voicePath, musicPath, outputPath });
  console.log(command.join(" "));
  await runCommand(command);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

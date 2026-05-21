import { spawn } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import { getFfmpegBinary } from "@/lib/media/ffmpeg";

async function main() {
  loadEnvConfig(process.cwd());
  const { getYoutubeRtmpTarget } = await import("@/lib/media/stream");
  const input = process.env.STREAM_INPUT_PATH ?? "public/rendered/fallback-loop.mp4";
  const target = getYoutubeRtmpTarget();
  const args = [
    "-re",
    "-stream_loop",
    "-1",
    "-i",
    input,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-b:v",
    "3500k",
    "-maxrate",
    "3500k",
    "-bufsize",
    "7000k",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-f",
    "flv",
    target
  ];
  const ffmpeg = getFfmpegBinary();
  console.log(`${ffmpeg} ${args.map((arg) => (arg.includes(" ") ? `"${arg}"` : arg)).join(" ")}`);
  const child = spawn(ffmpeg, args, { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 1));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

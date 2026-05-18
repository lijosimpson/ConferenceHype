import { spawn } from "node:child_process";

export function buildSegmentRenderCommand({
  voicePath,
  musicPath,
  outputPath
}: {
  voicePath: string;
  musicPath: string;
  outputPath: string;
}) {
  return [
    "ffmpeg",
    "-y",
    "-stream_loop",
    "-1",
    "-i",
    musicPath,
    "-i",
    voicePath,
    "-filter_complex",
    "[0:a]volume=0.12[a0];[1:a]volume=1.0[a1];[a0][a1]amix=inputs=2:duration=shortest",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    outputPath
  ];
}

export function runCommand(command: string[]) {
  return new Promise<void>((resolve, reject) => {
    const [bin, ...args] = command;
    const child = spawn(bin, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${bin} exited with code ${code}`));
      }
    });
  });
}

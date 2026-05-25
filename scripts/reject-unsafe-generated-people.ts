import { loadEnvConfig } from "@next/env";
import { getUnsafeReviewSourceErrors } from "@/lib/generation/sourceSafety";
import type { Citation, Segment } from "@/lib/types";

loadEnvConfig(process.cwd());

async function main() {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("segments")
    .select("id,title,summary,script,citations,status")
    .in("status", ["pending_review", "approved"]);

  if (error) {
    throw error;
  }

  const matches = (data ?? [])
    .map((row) => {
      const errors = getUnsafeReviewSourceErrors({
        title: row.title ?? "",
        summary: row.summary ?? "",
        script: row.script ?? "",
        citations: (row.citations ?? []) as Citation[]
      } satisfies Pick<Segment, "title" | "summary" | "script" | "citations">);
      return { ...row, errors };
    })
    .filter((row) => row.errors.length > 0);

  for (const row of matches) {
    const { error: updateError } = await supabase
      .from("segments")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
        risk_flags: row.errors
      })
      .eq("id", row.id);

    if (updateError) {
      throw updateError;
    }
  }

  console.log(
    JSON.stringify(
      {
        checked: data?.length ?? 0,
        rejected: matches.length,
        rejectedTitles: matches.map((row) => row.title),
        reasons: matches.map((row) => ({ title: row.title, errors: row.errors }))
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

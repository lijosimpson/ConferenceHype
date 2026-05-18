import type { SourceType } from "@/lib/types";

export function rankSource(type: SourceType) {
  switch (type) {
    case "official":
      return 1;
    case "media":
      return 2;
    case "company":
      return 3;
    case "verified_social":
      return 4;
    case "general_social":
      return 5;
    case "manual":
      return 3;
  }
}

export const defaultDisclaimer =
  "ASCO Hype is interactive AI commentary only. It is not reporting, journalism, medical education, clinical guidance, scientific validation, legal advice, or financial advice. ASCO Hype is not associated with the American Society of Clinical Oncology in any way.";

export function withSpokenDisclaimer(script: string) {
  if (script.toLowerCase().includes("asco hype is interactive ai commentary")) {
    return script;
  }
  return `${defaultDisclaimer}\n\n${script}\n\nReminder: ${defaultDisclaimer}`;
}

import { Languages } from "lucide-react";

const languages = ["English", "Spanish", "French", "Mandarin"];

export function LanguageControls() {
  return (
    <section className="border border-ink/10 bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <Languages className="h-5 w-5 text-cyanline" />
        <h2 className="text-xl font-black text-ink">Language controls</h2>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {languages.map((language) => (
          <label
            key={language}
            className="flex items-center gap-2 border border-ink/10 p-3 text-sm font-bold"
          >
            <input type="checkbox" defaultChecked={language === "English"} />
            {language}
          </label>
        ))}
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/65">
        Approved English scripts are translated first, then reviewed again
        before dubbed audio is rendered.
      </p>
    </section>
  );
}

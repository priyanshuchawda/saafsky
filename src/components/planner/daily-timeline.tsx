import type { DailyStep } from "@/features/planner/daily";
import {
  translate,
  translateText,
  type Language,
} from "@/features/i18n/messages";

export function DailyTimeline({
  steps,
  language,
}: {
  steps: DailyStep[];
  language: Language;
}) {
  return (
    <section className="plan scenario-result" aria-live="polite">
      <p className="eyebrow">{translate(language, "dailyPlan")}</p>
      <h2>
        {translate(language, "morningToEvening")}{" "}
        <em>{translate(language, "evening")}</em>
      </h2>
      <ol>
        {steps.map((step) => (
          <li key={step.id}>
            <span>{translateText(language, step.period)}</span>
            <div>
              <strong>{translateText(language, step.title)}</strong>
              <p>{translateText(language, step.detail)}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="fine">{translate(language, "planCaveat")}</p>
    </section>
  );
}

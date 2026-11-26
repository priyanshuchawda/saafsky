import type { DailyStep } from "@/features/planner/daily";
import { translate, type Language } from "@/features/i18n/messages";
import { localizeDailyStep } from "@/features/i18n/daily";

export function DailyTimeline({
  steps,
  language,
}: {
  steps: DailyStep[];
  language: Language;
}) {
  return (
    <section className="plan scenario-result">
      <p className="eyebrow">{translate(language, "dailyPlan")}</p>
      <h2>
        {translate(language, "morningToEvening")}{" "}
        <em>{translate(language, "evening")}</em>
      </h2>
      <ol>
        {steps.map((step) => {
          const copy = localizeDailyStep(language, step);
          return (
            <li key={step.id}>
              <span>{copy.period}</span>
              <div>
                <strong>{copy.title}</strong>
                <p>{copy.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="fine">{translate(language, "planCaveat")}</p>
    </section>
  );
}

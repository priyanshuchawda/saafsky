import { RecommendationList } from "@/components/recommendation-list";
import { translate, type Language } from "@/features/i18n/messages";
import type { Recommendation } from "@/features/recommendations/engine";

export function ScenarioActionPlan({
  actions,
  language,
  comparison,
}: {
  actions: Recommendation[];
  language: Language;
  comparison: boolean;
}) {
  return (
    <article
      id={comparison ? "comparison-plan" : undefined}
      className="plan"
      aria-label={translate(
        language,
        comparison ? "secondHouseholdPlan" : "firstHouseholdPlan",
      )}
    >
      <p className="eyebrow">
        {translate(
          language,
          comparison ? "secondHouseholdPlan" : "exampleActionPlan",
        )}
      </p>
      <h2>
        {comparison ? (
          translate(language, "secondHouseholdPlan")
        ) : (
          <>
            {translate(language, "whatChanges")}{" "}
            <em>{translate(language, "today")}</em>
          </>
        )}
      </h2>
      <RecommendationList actions={actions} language={language} />
      <p className="fine">{translate(language, "generalInformation")}</p>
    </article>
  );
}

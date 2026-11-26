import { ActionReason } from "@/components/action-reason";
import { localizeRecommendation } from "@/features/i18n/recommendations";
import type { Language } from "@/features/i18n/messages";
import type { Recommendation } from "@/features/recommendations/engine";

export function RecommendationList({
  actions,
  language,
}: {
  actions: Recommendation[];
  language: Language;
}) {
  return (
    <ol>
      {actions.map((action, index) => {
        const copy = localizeRecommendation(language, action);
        return (
          <li key={action.id}>
            <span>0{index + 1}</span>
            <div>
              <strong>{copy.title}</strong>
              <p>{copy.description}</p>
              <ActionReason action={action} language={language} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

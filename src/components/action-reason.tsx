import type { Recommendation } from "@/features/recommendations/engine";
import {
  evidenceCatalog,
  reasonDescriptions,
} from "@/features/recommendations/evidence";
import { translate, translateText, type Language } from "@/features/i18n/messages";

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function ActionReason({
  action,
  language,
}: {
  action: Recommendation;
  language: Language;
}) {
  const reasons = action.reasonCodes
    .map((code) => reasonDescriptions[code])
    .filter(isDefined);
  const evidence = action.evidenceIds
    .map((id) => evidenceCatalog[id])
    .filter(isDefined);
  return (
    <details className="action-reason">
      <summary>{translate(language, "actionWhy")}</summary>
      <ul>
        {reasons.map((reason) => (
          <li key={reason}>{translateText(language, reason)}</li>
        ))}
      </ul>
      <p>
        {translate(language, "relatedGuidance")}{" "}
        {evidence.map((source, index) => (
          <span key={source.url}>
            {index > 0 && " · "}
            <a href={source.url}>{source.label}</a>
          </span>
        ))}
      </p>
      <p>{translate(language, "estimateConditionsDiffer")}</p>
    </details>
  );
}

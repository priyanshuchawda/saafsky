import type { Recommendation } from "@/features/recommendations/engine";
import {
  evidenceCatalog,
  reasonDescriptions,
} from "@/features/recommendations/evidence";

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function ActionReason({ action }: { action: Recommendation }) {
  const reasons = action.reasonCodes
    .map((code) => reasonDescriptions[code])
    .filter(isDefined);
  const evidence = action.evidenceIds
    .map((id) => evidenceCatalog[id])
    .filter(isDefined);
  return (
    <details className="action-reason">
      <summary>Why this action?</summary>
      <ul>
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p>
        Related guidance:{" "}
        {evidence.map((source, index) => (
          <span key={source.url}>
            {index > 0 && " · "}
            <a href={source.url}>{source.label}</a>
          </span>
        ))}
      </p>
      <p>These rules use a city-scale estimate; local conditions may differ.</p>
    </details>
  );
}

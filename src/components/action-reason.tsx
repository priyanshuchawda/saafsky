import type { Recommendation } from "@/features/recommendations/engine";
import {
  evidenceCatalog,
  reasonDescriptions,
} from "@/features/recommendations/evidence";

export function ActionReason({ action }: { action: Recommendation }) {
  const reasons = action.reasonCodes
    .map((code) => reasonDescriptions[code])
    .filter(Boolean);
  const evidence = action.evidenceIds
    .map((id) => evidenceCatalog[id])
    .filter(Boolean);
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

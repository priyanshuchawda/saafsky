"use client";

import { useLanguage } from "@/hooks/use-preferences";
import { translate } from "@/features/i18n/messages";

export function SkipLink() {
  const [language] = useLanguage();
  return (
    <a className="skip-link" href="#main-content">
      {translate(language, "skip")}
    </a>
  );
}

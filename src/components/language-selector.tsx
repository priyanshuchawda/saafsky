"use client";

import { useEffect } from "react";
import { useLanguage } from "@/hooks/use-preferences";
import { translate } from "@/features/i18n/messages";

export function LanguageSelector() {
  const [language, setLanguage] = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className="language-selector">
      <label htmlFor="site-language">{translate(language, "language")}</label>
      <select
        id="site-language"
        value={language}
        onChange={(event) => {
          const nextLanguage = event.target.value === "hi" ? "hi" : "en";
          document.documentElement.lang = nextLanguage;
          setLanguage(nextLanguage);
        }}
      >
        <option value="en">{translate(language, "english")}</option>
        <option value="hi">{translate(language, "hindi")}</option>
      </select>
    </div>
  );
}

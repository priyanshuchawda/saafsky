"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSelector } from "@/components/language-selector";
import { translate } from "@/features/i18n/messages";
import { useLanguage } from "@/hooks/use-preferences";

const pages = [
  { href: "/", label: "dashboard" },
  { href: "/planner", label: "planner" },
  { href: "/indoor", label: "indoor" },
  { href: "/impact", label: "commute" },
  { href: "/assistant", label: "assistant" },
  { href: "/settings", label: "preferences" },
  { href: "/scenarios", label: "scenarios" },
] as const;

export function SiteHeader() {
  const [language] = useLanguage();
  const pathname = usePathname();
  return (
    <header className="shell site-header">
      <div className="top">
        <Link
          className="brand"
          href="/"
          aria-label={translate(language, "home")}
        >
          saafsky<span>.</span>
        </Link>
        <p>{translate(language, "tagline")}</p>
        <LanguageSelector />
      </div>
      <nav
        aria-label={translate(language, "pages")}
        className="quick-nav desktop-nav"
      >
        <PageLinks language={language} pathname={pathname} />
      </nav>
      <details className="mobile-nav">
        <summary>{translate(language, "explore")}</summary>
        <nav aria-label={translate(language, "pages")}>
          <PageLinks language={language} pathname={pathname} />
        </nav>
      </details>
    </header>
  );
}

function PageLinks({
  language,
  pathname,
}: {
  language: "en" | "hi";
  pathname: string;
}) {
  return pages.map((page) => (
    <Link
      href={page.href}
      key={page.href}
      aria-current={pathname === page.href ? "page" : undefined}
    >
      {translate(language, page.label)}
    </Link>
  ));
}

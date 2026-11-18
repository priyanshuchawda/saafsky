import Link from "next/link";

const pages = [
  { href: "/", label: "Dashboard" },
  { href: "/planner", label: "Daily planner" },
  { href: "/indoor", label: "Indoor air" },
  { href: "/impact", label: "Commute impact" },
  { href: "/assistant", label: "Ask SaafSky" },
  { href: "/settings", label: "My preferences" },
  { href: "/scenarios", label: "Scenarios" },
];

export function SiteHeader() {
  return (
    <header className="shell site-header">
      <div className="top">
        <Link className="brand" href="/" aria-label="SaafSky home">
          ✳ saafsky<span>.</span>
        </Link>
        <p>A little clarity for the air you breathe</p>
      </div>
      <nav aria-label="SaafSky pages" className="quick-nav">
        {pages.map((page) => (
          <Link href={page.href} key={page.href}>
            {page.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

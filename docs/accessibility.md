# Accessibility

SaafSky uses native links, buttons, form controls, disclosures, headings, and live status messages. The same navigation appears across every route. On mobile, a native `details` disclosure keeps the page compact while preserving keyboard operation.

| User need | Product behavior | Automated evidence |
| --- | --- | --- |
| Bypass repeated controls | A visible-on-focus skip link moves focus to the page's main content. | `tests/e2e/accessibility.spec.ts` verifies keyboard activation and focus. |
| Understand form controls | Inputs and selects have visible labels; planner commitment errors are associated with the fields and marked invalid. | axe checks each route; `tests/e2e/journeys.spec.ts` exercises planner constraints. |
| Navigate by keyboard | Links, buttons, forms, recommendation disclosures, and the mobile menu use native browser interactions and visible focus styling. | Browser test opens the mobile menu using Enter, tabs through destinations, and navigates to the planner. |
| Receive dynamic feedback | Search results, loading/error states, indoor-air context, planner results, and assistant replies are exposed with text and appropriately scoped status regions. | Search journey asserts a `role="status"` announcement; axe runs on the assistant response state. |
| Interpret AQI without color | The dashboard presents a numeric US AQI and a named category; recommendations include text explanations and evidence links. | Route axe checks and expanded-recommendation axe check. |
| Use the interface on small screens | Navigation collapses into an expandable menu; forms stack; content reflows without horizontal page overflow. | `tests/e2e/responsive-pages.spec.ts` checks 320px, 390px, and 1440px widths. |
| Operate touch controls | Visible primary buttons, inputs, selects, navigation links, and disclosures have at least 48px height. | Responsive browser test checks rendered target sizes on every product page. |

## Reproduce checks

```powershell
.\scripts\verify.ps1 -Browser
```

The production browser suite runs axe checks on all seven route entry states, plus an assistant response and an expanded recommendation. It also exercises navigation, mobile search and preferences, narrow layouts, target sizing, and key planner and assistant interactions. These automated checks complement keyboard, screen-reader, zoom, and contrast review during release validation; they do not by themselves certify WCAG conformance. The current interface is in English.

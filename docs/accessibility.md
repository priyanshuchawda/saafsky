# Accessibility

SaafSky uses native links, buttons, form controls, disclosures, headings, and live status messages. The same navigation appears across every route. On mobile, a native `details` disclosure keeps the page compact while preserving keyboard operation.

| User need                          | Product behavior                                                                                                                                                                                            | Automated evidence                                                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Bypass repeated controls           | A visible-on-focus skip link moves focus to the page's main content.                                                                                                                                        | `tests/e2e/accessibility.spec.ts` verifies keyboard activation and focus.                                                                       |
| Understand form controls           | Inputs and selects have visible labels; planner commitment errors are associated with the fields and marked invalid.                                                                                        | axe checks each route; `tests/e2e/journeys.spec.ts` exercises planner constraints.                                                              |
| Navigate by keyboard               | Links, buttons, forms, recommendation disclosures, and the mobile menu use native browser interactions and visible focus styling.                                                                           | Browser test opens the mobile menu using Enter, tabs through destinations, and navigates to the planner.                                        |
| Receive dynamic feedback           | Search results use a language-aware status announcement; the assistant announces request state and only its newest reply. Planner, indoor, commute, and scenario results remain available as semantic text. | `tests/e2e/mobile-search.spec.ts`, `tests/e2e/assistant-announcements.spec.ts`, and axe checks on response states.                              |
| Interpret AQI without color        | The dashboard presents a numeric US AQI and a named category; recommendations include text explanations and evidence links.                                                                                 | Route axe checks and expanded-recommendation axe check.                                                                                         |
| Compare forecast hours             | Each visual bar accompanies its time and numeric AQI in a named list; missing values remain visible as unavailable. The bar scale is described in text.                                                     | `tests/e2e/journeys.spec.ts` checks values, missing-data behavior, and navigation to the planner.                                               |
| Use the interface on small screens | Navigation collapses into an expandable menu; forms stack; content reflows without horizontal page overflow.                                                                                                | `tests/e2e/responsive-pages.spec.ts` checks 320px, 390px, 768px, 1024px, and 1440px widths.                                                     |
| Preserve user display preferences  | Pages retain mobile reflow under WCAG text-spacing overrides, and keyboard focus uses system colors in forced-colors mode.                                                                                  | `tests/e2e/accessibility.spec.ts` applies text-spacing overrides to every route and checks forced-colors focus visibility.                      |
| Choose a reading language          | English and Hindi labels, guidance, navigation, and chat responses follow the selected language; the choice persists in the browser.                                                                        | `tests/i18n.test.ts` and the Hindi production-browser journey verify translated content, preference persistence, and the language sent to chat. |
| Compare household plans            | A native disclosure button exposes the comparison selector and individually named plans; each plan retains its reason and source links.                                                                     | `tests/e2e/accessibility.spec.ts` runs axe and checks horizontal fit with the comparison open at 320px.                                         |
| Operate touch controls             | Visible primary buttons, inputs, selects, navigation links, and disclosures have at least 48px height.                                                                                                      | Responsive browser test checks rendered target sizes on every product page.                                                                     |

## Reproduce checks

```powershell
.\scripts\verify.ps1 -Browser
```

## Manual release review

On November 26, 2026, the project owner reported hands-on checks of the product
flows, keyboard operation, assistive-technology output, English and Hindi
content, desktop and mobile layouts, and zoom/reflow behavior; all were
reported working as expected. This complements the automated checks above.
Assistive-technology names, device/browser versions, and a formal WCAG
conformance assessment were not recorded.

The production browser suite runs axe checks on all seven route entry states, plus an assistant response and an expanded recommendation. It also exercises navigation, mobile search and preferences, narrow layouts, target sizing, and key planner and assistant interactions. These repeatable checks provide practical evidence for keyboard, screen-reader, zoom, and contrast review during release validation. English is the default language, and Hindi is available throughout the product.

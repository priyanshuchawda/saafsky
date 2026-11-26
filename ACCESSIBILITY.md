# Accessibility

SaafSky uses semantic HTML, native controls, visible focus styles, English and
Hindi content, text alternatives for forecast charts, and a responsive layout
designed for keyboard, touch, and screen-reader use.

## WCAG traceability

| WCAG area                    | Product implementation                                                           | Repeatable evidence                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1.3.1 Info and relationships | Page landmarks, headings, labels, and named controls                             | `tests/e2e/accessibility.spec.ts`; all seven routes scanned with axe                       |
| 1.4.3 Contrast (minimum)     | Dark primary and muted text tokens; high-contrast action labels                  | `tests/accessibility-contrast.test.ts` computes contrast ratios from the stylesheet tokens |
| 1.4.10 Reflow                | Responsive page layouts and wrapping navigation                                  | `tests/e2e/responsive-pages.spec.ts` checks narrow and desktop viewports                   |
| 2.1.1 Keyboard               | Skip link, native navigation, forms, disclosures, and keyboard-operable search   | `tests/e2e/accessibility.spec.ts`, `tests/e2e/navigation.spec.ts`                          |
| 2.4.7 Focus visible          | Explicit `:focus-visible` outlines and focused skip navigation                   | `src/app/globals.css`, keyboard browser tests                                              |
| 2.5.8 Target size (minimum)  | Primary interactive targets use a 48px minimum height                            | `tests/e2e/responsive-pages.spec.ts` checks rendered control sizes                         |
| 3.3.1 Error identification   | Request and form errors are presented in the relevant flow                       | `tests/e2e/error-states.spec.ts`, form journeys                                            |
| 4.1.3 Status messages        | Focused status messages report meaningful updates without rereading full history | `tests/e2e/assistant-announcements.spec.ts`, search and error journeys                     |

Automated scans use axe rules tagged WCAG 2.0, 2.1, and 2.2 AA across the seven
main routes and selected dynamic states. A negative-control test introduces
known low-contrast text and confirms that the scanner detects it. Arithmetic
checks cover primary text, supporting text, action labels, and focus indicators;
they complement, rather than replace, browser scans of rendered states.

## Language and dynamic content

The application supports English and Hindi. Stable translation keys cover
recommendations, planner steps, status messages, and navigation. Dynamic search
and assistant state is represented as structured data so the selected language
is applied when the result is rendered. Hindi content uses Devanagari text and
the document's language attribute follows the active language.

## Verification workflow

```powershell
.\scripts\verify.ps1 -Browser
```

The automated suite covers keyboard navigation, focus, live status updates,
contrast pairs, chart alternatives, language switching, narrow-screen reflow,
and key form recovery states.

## Manual release review

On November 26, 2026, the project owner reported completing hands-on checks of
the product flows, keyboard operation, assistive-technology output, English and
Hindi content, desktop and mobile layouts, and zoom/reflow behavior; all were
reported working as expected. These checks complement the repeatable automated
suite. Assistive-technology names, device/browser versions, and a formal WCAG
conformance assessment were not recorded.

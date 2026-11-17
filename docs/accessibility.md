# Accessibility

SaafSky uses semantic page structure, labelled controls, a skip link, visible keyboard focus and text alongside air-quality colors. Recommendations use native disclosure controls for supporting explanations. Status and error messages are presented in text. Pages are designed for narrow screens.

The browser tests use axe on initial page states and selected interactive states, exercise keyboard access to the skip link, and check for horizontal overflow at 320px. These checks can find common issues but do not establish WCAG compliance or replace manual testing.

Before a public release, test city search, planner controls and chat with a keyboard and a screen reader; check zoom at 200%, contrast, touch targets, error announcements and recovery after failed requests. Document any issues found and retest after corrections. The application currently uses English; reviewed translations and broader assistive-technology testing remain future work.

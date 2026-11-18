# Accessibility

SaafSky uses semantic page structure, labelled controls, a skip link, visible keyboard focus, and text alongside air-quality colors. Recommendations use native disclosure controls for explanations. Search results announce their count and selection, and user-facing loading or error states are conveyed in text.

Primary form controls, navigation links, and action disclosures provide 48px touch targets. The responsive browser suite checks every product page at 320px, 390px, and desktop widths for horizontal overflow and undersized controls. Playwright also runs axe checks on each route and on selected interactive states, including chat responses and expanded explanations.

Release validation pairs these automated checks with keyboard and screen-reader review of city search, planner controls, and chat; 200% zoom and contrast checks; and verification of error recovery. SaafSky currently presents its interface in English.

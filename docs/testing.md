# Testing and verification

Requires Node.js 22.18 or newer. From the repository root:

```sh
npm ci
npm test
npm run lint
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

Unit tests use Node's test runner and cover domain calculations, input schemas, timestamps, recommendation and planner behavior, provider validation, request limits and response handling. Browser tests use Playwright with mocked external responses for user journeys, error states, headers and accessibility checks. They do not require a Gemini key. Tests cover representative cases, not every possible provider failure, browser, assistive technology or security threat.

The browser suite currently starts a development server; a production-build browser run and deployment-specific smoke tests are still needed before release. A separate manual live-service check is useful for provider credentials, quotas and response changes, but consumes free-tier requests and should not be part of routine tests. Never print keys or private user input in test output.

GitHub Actions is intentionally disabled. Run checks locally until the owner chooses to enable the workflow for a final pre-release verification. Results apply to the exact code and environment tested; do not describe an older run as evidence for a newer commit.

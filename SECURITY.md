# Security policy

Please report suspected vulnerabilities privately to the repository owner. Include affected behavior and reproduction steps, but do not include API keys, real personal data or sensitive chat content. If a credential is exposed, rotate it immediately.

The [security and privacy guide](docs/security-privacy.md) describes the current controls, data handling and known limitations. The application and its dependencies require ongoing review; a passing automated test is not a security guarantee.

## Threat model and controls

SaafSky treats browser input, conversation history, and provider responses as
untrusted. The main risks in scope are credential exposure, public API abuse,
malformed external data, prompt injection, unsupported AI claims, and unsafe
browser execution.

| Risk                                  | Control                                                                                                                                                                                   | Verification                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Secret exposure                       | Provider credentials remain server-side; tracked files are scanned for common token formats and committed environment files                                                               | `npm run check:secrets`                                                                     |
| Request abuse                         | Bounded JSON bodies, validated coordinates and origins, shared visitor/global Redis budgets, and fail-closed public configuration                                                         | `tests/request-body.test.ts`, `tests/rate-limit-adapter.test.ts`, `npm run test:protection` |
| Provider data errors                  | Runtime Zod schemas, deadlines, explicit missing-data handling, and redacted failure categories                                                                                           | `tests/air-provider.test.ts`, endpoint and schema tests                                     |
| Prompt injection and forged citations | User/history are untrusted context; deterministic actions remain authoritative; output schema, action IDs, evidence IDs, duplicate references, and numeric-free prose are enforced        | `tests/assistant.test.ts`, `tests/gemini-adapter.test.ts`                                   |
| Browser injection and framing         | Static-compatible CSP resource restrictions, `nosniff`, frame denial, and restrictive referrer/permissions headers; inline scripts and styles remain allowed for Next.js static rendering | `tests/e2e/security.spec.ts`, `tests/e2e/csp-experiment.spec.ts`                            |
| Sensitive response caching            | Assistant API responses send `Cache-Control: no-store`                                                                                                                                    | `tests/e2e/security.spec.ts`, API contract tests                                            |

## Operational handling

Keep `.env.local` out of source control and use Vercel environment settings for
deployment secrets. If a credential is exposed, revoke or rotate it at its
provider, update the local and deployment settings, and run the protected API
smoke checks again. Do not include prompts, household details, provider payloads,
or credentials in diagnostic logs.

The enforced static-compatible CSP is checked against all product routes in
production-browser tests. Inline script and style execution remain allowed to
preserve static rendering and Cache Components; this policy is not a strict
nonce-based XSS defense. A nonce policy requires a deliberate review of Next.js
dynamic-rendering and cache behavior. AI prose containing numeric digits is
rejected, and action/evidence references are validated; this does not provide
a mathematical proof that every qualitative statement is factually correct.

## Reproduce security checks

```powershell
npm run check:secrets
npm run test:protection
npm run test:e2e:production
npm audit --omit=dev --audit-level=high
```

The secret scan covers tracked files and does not print matched secret values.
The dependency audit checks published advisories for production packages; it
does not replace code review or a security assessment.

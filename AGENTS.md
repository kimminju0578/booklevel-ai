<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# BOOKLEVEL AI development rules

- Preserve working behavior and make scoped, incremental changes.
- Keep TypeScript strict and minimize `any`.
- Never hardcode environment values or expose private API keys to client code.
- Validate user input and structured AI output; Zod is the source of truth.
- Implement loading, empty, error, and retry states for data-driven flows.
- Do not delete features to conceal errors.
- Manage database changes through forward migrations and keep RLS/ownership checks intact.
- Preserve responsive mobile behavior and baseline accessibility.
- Run lint, typecheck, tests, and build before declaring work complete.

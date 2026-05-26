<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project standards

- Use `react-hook-form` for every user-facing form.
- Use `zod` validation for every form and mutation, sharing schemas between client and server whenever possible.
- Use `@hookform/resolvers/zod` when wiring forms to Zod.
- Use `@tanstack/react-query` for client-side requests and mutations.
- Use `nuqs` for URL/query-string state such as filters, selected month, selected year, and selected type.
- Do not introduce `useState` or `useEffect` unless there is a concrete technical reason and the code comment explains why.
- Use Base UI form primitives for visible inputs and selects.
- Use Base UI `Button` for visible buttons.
- Buttons should use a pointer cursor by default, with disabled buttons using `not-allowed`.
- Use `date-fns` for date creation, parsing, formatting, month arithmetic, and locale formatting.
- Store money in cents and format all currency values as BRL.

# Photo Abstract Editorial Web App: Technical Design

## Stack

- Next.js App Router with TypeScript.
- Vercel Fluid Compute using the default Node.js runtime.
- Vercel AI SDK and AI Gateway.
- Browser Canvas API for deterministic composition and PNG export.
- No database, object storage, authentication, analytics, or image persistence.

## Data flow

1. The client reads the selected file into a local object URL for preview.
2. A multipart request sends the file and selected format to `/api/analyze`.
3. The route validates MIME type and size, converts the file to a model message attachment, and requests schema-constrained JSON.
4. The response contains a title, palette, and normalized abstract marks only.
5. The client loads the original local object URL into a canvas and draws the abstract plan beneath or beside it according to the selected format.
6. `canvas.toBlob()` creates a local PNG download. No output is uploaded.

## Trust and privacy boundary

- The photo necessarily leaves the browser for model inference through Vercel AI Gateway.
- The application itself does not write photos to disk, Blob, logs, or a database.
- API responses contain only derived layout metadata.
- The route uses `Cache-Control: no-store` and rejects files over 20 MB.

## Model output

Normalized coordinates use a 0..1 panel coordinate system. Supported marks are rectangles, ellipses, lines, arcs, and tapered bars. Colors must come from a model-selected palette derived from the image.

## Risks and mitigations

- Model invents visual content: strict schema, bounded mark types, prompt constraints, and client-side validation.
- Unexpected spend from an unprotected URL: UI remains unlisted, request size and output complexity are bounded, and Vercel AI Gateway budgets should be configured.
- Photograph fidelity: the model never returns final photo pixels; canvas reuses the original browser image.
- Text rendering differences: use stable web-safe serif fallbacks and fit title text deterministically.

## Verification

- Unit tests for schema validation and geometry bounds.
- Production build and typecheck.
- Browser test of upload, format selection, mocked analysis response, canvas render, and download.
- Visual comparison against the accepted UI concept at desktop and mobile sizes.


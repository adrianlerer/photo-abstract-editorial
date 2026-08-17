# Photo Abstract Editorial Web App

## User problem

The repository currently provides a prompt-based Codex skill, not an online application. The user needs a private-by-obscurity, single-user web interface that can turn an uploaded photograph into a downloadable editorial composition for non-commercial articles and presentations.

## Goals

- Upload one JPG, PNG, or WebP photograph up to 20 MB.
- Preserve the uploaded photograph exactly, allowing only proportional scaling and cropping during final composition.
- Use AI only to analyze visible spatial and color relationships and propose a restrained abstract panel plus an English title.
- Offer Editorial, Presentation, and Square output formats.
- Compose and export the finished PNG in the browser.
- Avoid storing uploaded photographs or generated compositions.
- Deploy on Vercel without a password screen.

## Non-goals

- Multi-user accounts, galleries, history, collaboration, or cloud storage.
- Commercial use or redistribution of the upstream prompt/skill.
- Generative alteration, retouching, or replacement of the uploaded photograph.

## Primary flow

1. User drops or selects a photograph.
2. The browser validates and previews it locally.
3. User selects an output format.
4. User requests a composition.
5. The server sends the photograph and the upstream editorial rules to an AI model and receives a structured visual plan.
6. The browser deterministically draws the original photograph, abstract panel, and title onto a canvas.
7. User downloads the PNG.

## States

- Empty: upload control and disabled create action.
- Ready: local preview, format selector, create action.
- Loading: progress message and disabled controls.
- Success: rendered composition and enabled download action.
- Error: concise recoverable error with the source photo retained locally.

## Acceptance criteria

- The source image is never persisted by application code.
- The output contains the original source pixels, not an AI-redrawn photograph.
- All three formats render and download as PNG.
- Invalid type, oversize input, model failure, and malformed model output are handled visibly.
- Desktop and mobile layouts remain usable and accessible.


# syndicatetycoon.com

Coming-soon page for Syndicate Tycoon, served by GitHub Pages from the root of `main`. Static HTML and CSS, no build step and no data collection.

Preview locally with `node scripts/serve.mjs` (http://127.0.0.1:4173) and check with `node --test tests/*.test.mjs`. Node.js 20+.

© 2026 Syndicate Tycoon. All rights reserved.

## Gymbro

Run npm run build:gymbro to type-check and build the sibling ../gymbro/code project, then stage the compiled browser game in gymbro/. To use another source directory, run npm run build:gymbro -- C:/path/to/gymbro/code. Dependencies must already be installed in that project. The browser build uses /gymbro/ asset paths and keeps its gymbro.save storage key. Preview with npm run dev and open http://127.0.0.1:4173/gymbro/. Commit gymbro/ and push main to publish at https://syndicatetycoon.com/gymbro/. The alpha game is independent.

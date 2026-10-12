# AskMe

AskMe is a responsive revision quiz app for MCQ and essay questions. Its delivery order is web first, desktop second, and mobile through the installable PWA. It uses Next.js App Router for web routes, Tailwind CSS for styling, and Dexie to keep quiz data in the browser. The app has no business backend; AI API keys remain in per-device browser storage.

## Development

```sh
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Run a production build locally with `npm start` after `npm run build`.

## Project notes

- Routes live in `app/`; interactive screens and browser storage stay in client components.
- `PLAN.md` is the roadmap and `learn/README.md` indexes the project lessons.
- The web app includes an install manifest and an offline service worker.

# AskMe

AskMe is a local-first study app for organizing learning material and turning it into active practice. Learners group subjects into roadmaps and topics, keep lessons and resources beside their questions, then study with quizzes and due reviews. Optional AI tools can generate questions and help grade essay answers.

The app is a browser-based Next.js application. Study data is stored on the device in IndexedDB through Dexie; there is no application backend or account-based sync. Users can export and restore local backups. AI provider keys stay in browser storage and are not included in backups. The installable PWA supports offline use with limits for dynamic content; native mobile apps and cloud sync are not current product commitments.

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

- [Project overview](docs/project-overview.md) describes the current vision, boundaries, and source layout.
- [Design system](DESIGN.md) is the styling source of truth.
- [Learning guides](docs/learn/README.md) explain the technologies and decisions represented in the code. Some early guides describe historical implementations; use the project overview for the current architecture.
- Routes live in `src/app/`; browser-only screens and storage access stay in Client Components.
- The app includes a web app manifest and a service worker. Offline behavior is not guaranteed for every dynamic route or resource.

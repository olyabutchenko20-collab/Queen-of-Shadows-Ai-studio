# Queen of Shadows AI Studio

Bilingual Russian/English gothic music studio. The music-generation backend uses Google's Gemini Interactions API with the `lyria-3.5` model.

## What works after server setup
- Generate a full song from a style prompt and optional custom lyrics.
- Select Gothic Metal, Heavy Metal, Rock or Darkwave.
- Select female, male, duet or instrumental mode in the interface.
- Play the generated MP3 in the built-in player and download it.
- Keep project notes in the browser library.

## Important
The app is not a standalone offline music generator. Song generation requires an internet connection, a Google AI API key, a running Node.js server, and paid Lyria 3.5 usage. Google currently lists Lyria 3.5 full-song generation at $0.08 per request. Check current pricing before use.

Never put your API key in `app.js`, `index.html`, or any public file. Keep it as a server environment variable named `GEMINI_API_KEY`.

## Run locally
1. Install Node.js 20 or newer.
2. In this folder, set the environment variable `GEMINI_API_KEY` to your own Google AI Studio key.
3. Run `npm start`.
4. Open `http://localhost:3000`.

On macOS/Linux:
```bash
export GEMINI_API_KEY="YOUR_KEY"
npm start
```

On Windows PowerShell:
```powershell
$env:GEMINI_API_KEY="YOUR_KEY"
npm start
```

## Deploy
Deploy this folder to a Node.js host that supports server-side environment variables. Set `GEMINI_API_KEY` in the host's private environment-variable settings and start with `npm start`. Do not deploy as a static-only site: `server.js` must run as the backend.

## API
- `GET /api/health` reports whether the server has a key configured.
- `POST /api/generate` accepts `{ "title": "...", "prompt": "..." }` and returns generated MP3 data as base64.

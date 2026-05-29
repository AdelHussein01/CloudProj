# Local Development

The local app needs two terminals after dependencies are installed.

## Install

```bash
npm install
```

## Terminal 1: API

```bash
$env:CORS_ORIGIN="http://localhost:3000"
npm run dev:api
```

On macOS/Linux:

```bash
CORS_ORIGIN=http://localhost:3000 npm run dev:api
```

## Terminal 2: Web

```bash
$env:NEXT_PUBLIC_API_URL="http://localhost:3001"
npm run dev:web
```

On macOS/Linux:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev:web
```

Open `http://localhost:3000`, create a room, then open the copied room link in another browser or incognito window.

## Validation

```bash
npm run lint
npm test
npm run build
```

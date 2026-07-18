# DataCore Frontend

Frontend de analítica retail para el servicio [DataCore backend](https://github.com/chrismedinapy/backend), construido con React, TypeScript y Vite.

## Requisitos

- Node.js 24
- npm 11
- Backend disponible en `http://localhost:8000`

## Desarrollo

```bash
cp .env.example .env
npm ci
npm run dev
```

La aplicación queda disponible en `http://localhost:3000` y consume por defecto `http://localhost:8000/api/v1`.

## Validación

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run build
docker build -t datacore-frontend .
```

## Flujo de ramas

```text
feature/* -> release -> main
```

Cada módulo funcional se desarrolla en una rama `feature/*` y se integra mediante pull request hacia `release`.

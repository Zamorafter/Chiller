# Chiller

Aplicacion web instalable (PWA) para registrar mediciones de chillers, guardar jornadas en PostgreSQL y actualizar un Excel maestro basado en la plantilla de `libs/`.

## Requisitos

- Node.js 18 o superior
- PostgreSQL accesible desde `DATABASE_URL`

## Variables de entorno

Copia `.env.example` a `.env` y ajusta estos valores:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PG_POOL_MAX`
- `PG_IDLE_TIMEOUT_MS`

## Arranque local

```bash
npm install
npm start
```

La app queda disponible en `http://localhost:3000/chiller-app/login.html`.

## Flujo principal

- Los registros se guardan aunque falten campos.
- Los campos vacios se resaltan en pantalla y se listan en un modal.
- Al exportar, el Excel deja vacias las celdas que no recibieron datos.
- El archivo maestro se mantiene en `server/data/` y se genera un respaldo diario en `server/data/backups/`.

## Verificacion rapida

```bash
npm test
```

Ese comando genera un Excel de prueba usando la plantilla real para validar el flujo de exportacion.

## GitHub

Este workspace ya puede conectarse al remoto:

- `https://github.com/Zamorafter/Chiller.git`

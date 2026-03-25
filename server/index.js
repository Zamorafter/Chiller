const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generarExcelDesdeTemplate } = require('./excelGenerator');

require('dotenv').config();

const app = express();
app.use(cors({ origin: true }));

// Servir el frontend PWA desde el mismo host (misma origin)
app.use('/chiller-app', express.static(path.join(__dirname, '..'), { dotfiles: 'ignore' }));
app.get('/', (_req, res) => {
  res.redirect('/chiller-app/login.html');
});

app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const NOMBRE_EXCEL = 'Copia de 01-Check List - Control valores chillers i.xls';

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en el entorno (Supabase/PostgreSQL).');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.PG_POOL_MAX ? Number(process.env.PG_POOL_MAX) : 20,
  idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT_MS ? Number(process.env.PG_IDLE_TIMEOUT_MS) : 30000
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chiller_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(120) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      nombre VARCHAR(120) NULL,
      apellido VARCHAR(120) NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chiller_registros (
      id SERIAL PRIMARY KEY,
      usuario VARCHAR(120) NOT NULL,
      fecha DATE NOT NULL,
      chiller SMALLINT NOT NULL,
      voltaje JSONB NULL,
      nocturno JSONB NULL,
      diurno JSONB NULL,
      operador_nocturno VARCHAR(120) NULL,
      hora_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (usuario, fecha, chiller)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_chiller_registros_usuario_fecha
    ON chiller_registros (usuario, fecha DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_chiller_registros_fecha_chiller
    ON chiller_registros (fecha, chiller)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_chiller_registros_hora_envio
    ON chiller_registros (hora_envio DESC)
  `);
}

function calcularPendientes(payload = {}) {
  const pendientes = [];
  const secciones = ['voltaje', 'nocturno', 'diurno'];

  for (const seccion of secciones) {
    const values = payload[seccion] || {};
    for (const [key, value] of Object.entries(values)) {
      if (key.startsWith('obs_')) continue;
      if (String(value ?? '').trim() !== '') continue;
      pendientes.push(key);
    }
  }

  return pendientes;
}

function normalizeDateYMD(ymd) {
  // Esperamos yyyy-mm-dd
  const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error('fecha inválida');
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function parseJsonOrEmpty(v) {
  if (v === null || v === undefined) return {};
  // mysql2 a veces devuelve JSON como Buffer dependiendo de config/driver.
  if (Buffer.isBuffer(v)) {
    try {
      return JSON.parse(v.toString('utf8'));
    } catch {
      return {};
    }
  }
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  return v;
}

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  const m = String(header).match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ error: 'token requerido' });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'token inválido' });
  }
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, nombre, apellido } = req.body || {};
    const usernameNorm = String(username || '').trim().toLowerCase();
    const passwordStr = String(password || '');
    const nombreStr = String(nombre || '').trim() || null;
    const apellidoStr = String(apellido || '').trim() || null;

    if (!usernameNorm) return res.status(400).json({ error: 'username requerido' });
    if (!passwordStr) return res.status(400).json({ error: 'password requerida' });

    const passwordHash = await bcrypt.hash(passwordStr, 10);

    await pool.query(
      `
      INSERT INTO chiller_users (username, password_hash, nombre, apellido)
      VALUES ($1, $2, $3, $4)
      `,
      [usernameNorm, passwordHash, nombreStr, apellidoStr]
    );

    const token = jwt.sign({ username: usernameNorm }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.status(201).json({
      token,
      user: { username: usernameNorm, nombre: nombreStr, apellido: apellidoStr }
    });
  } catch (err) {
    // Duplicado de username o error genérico
    const msg = String(err?.message || '');
    // pg para UNIQUE KEY suele venir como 23505
    if (err?.code === '23505' || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('uniq')) {
      return res.status(409).json({ error: 'usuario ya existe' });
    }
    console.error(err);
    return res.status(500).json({ error: err?.message || 'error interno' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const usernameNorm = String(username || '').trim().toLowerCase();
    const passwordStr = String(password || '');

    if (!usernameNorm || !passwordStr) return res.status(400).json({ error: 'credenciales requeridas' });

    const result = await pool.query(
      `SELECT username, password_hash, nombre, apellido FROM chiller_users WHERE username = $1 LIMIT 1`,
      [usernameNorm]
    );
    const rows = result?.rows || [];

    if (!rows || !rows.length) return res.status(401).json({ error: 'credenciales inválidas' });
    const user = rows[0];

    const ok = await bcrypt.compare(passwordStr, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'credenciales inválidas' });

    const token = jwt.sign({ username: usernameNorm }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({
      token,
      user: { username: user.username, nombre: user.nombre, apellido: user.apellido }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message || 'error interno' });
  }
});

app.get('/api/registros', requireAuth, async (req, res) => {
  try {
    const fechaNorm = normalizeDateYMD(req.query.fecha);
    const chillerNo = Number(req.query.chiller);
    if (![1, 3].includes(chillerNo)) return res.status(400).json({ error: 'chiller inválido' });

    const usernameNorm = req.user?.username;
    const result = await pool.query(
      `
      SELECT usuario, fecha, chiller, voltaje, nocturno, diurno, operador_nocturno
      FROM chiller_registros
      WHERE usuario = $1 AND fecha = $2 AND chiller = $3
      LIMIT 1
      `,
      [usernameNorm, fechaNorm, chillerNo]
    );
    const rows = result?.rows || [];

    if (!rows || !rows.length) return res.json({ registro: null });
    const r = rows[0];
    return res.json({
      registro: {
        usuario: r.usuario,
        fecha: r.fecha,
        chiller: r.chiller,
        terminado: false,
        voltaje: parseJsonOrEmpty(r.voltaje),
        nocturno: parseJsonOrEmpty(r.nocturno),
        diurno: parseJsonOrEmpty(r.diurno)
      }
    });
  } catch (err) {
    return res.status(400).json({ error: err?.message || 'error' });
  }
});

// Upsert de chiller por (usuario, fecha, chiller)
app.post('/api/registros', requireAuth, async (req, res) => {
  try {
    const usernameNorm = req.user?.username;
    const { fecha, chiller, voltaje, nocturno, diurno } = req.body || {};

    const fechaNorm = normalizeDateYMD(fecha);
    const chillerNo = Number(chiller);
    if (![1, 3].includes(chillerNo)) return res.status(400).json({ error: 'chiller inválido' });

    console.log(`[registros:upsert] user=${usernameNorm} fecha=${fechaNorm} chiller=${chillerNo}`);

    const voltajeObj = voltaje || {};
    const operadorNocturno = voltajeObj?.op_nocturno || null;
    const voltajeJson = JSON.stringify(voltajeObj || {});
    const nocturnoJson = JSON.stringify(nocturno || {});
    const diurnoJson = JSON.stringify(diurno || {});

    await pool.query(
      `
      INSERT INTO chiller_registros (usuario, fecha, chiller, voltaje, nocturno, diurno, operador_nocturno)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (usuario, fecha, chiller)
      DO UPDATE SET
        voltaje = EXCLUDED.voltaje,
        nocturno = EXCLUDED.nocturno,
        diurno = EXCLUDED.diurno,
        operador_nocturno = EXCLUDED.operador_nocturno,
        hora_envio = CURRENT_TIMESTAMP
      `,
      [usernameNorm, fechaNorm, chillerNo, voltajeJson, nocturnoJson, diurnoJson, operadorNocturno]
    );

    return res.json({
      ok: true,
      pendientes: calcularPendientes({ voltaje: voltajeObj, nocturno, diurno })
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message || 'error interno' });
  }
});

app.post('/api/terminar', requireAuth, async (req, res) => {
  try {
    const { fecha } = req.body || {};
    const fechaNorm = normalizeDateYMD(fecha);
    const usernameNorm = req.user?.username;

    console.log(`[terminar] user=${usernameNorm} fecha=${fechaNorm}`);
    const result = await pool.query(
      `
      SELECT chiller, voltaje, nocturno, diurno
      FROM chiller_registros
      WHERE usuario = $1 AND fecha = $2 AND chiller IN (1, 3)
      `,
      [usernameNorm, fechaNorm]
    );
    const rows = result?.rows || [];
    console.log(`[terminar] filas=${(rows || []).length}`);

    const byChiller = new Map((rows || []).map((r) => [Number(r.chiller), r]));
    if (!byChiller.get(1) || !byChiller.get(3)) {
      return res.status(400).json({
        error: 'faltan registros: completa ambos chillers antes de terminar',
        falta: {
          chiller1: !byChiller.get(1),
          chiller3: !byChiller.get(3)
        }
      });
    }

    const chiller1Row = byChiller.get(1);
    const chiller3Row = byChiller.get(3);

    const excelBuffer = await generarExcelDesdeTemplate({
      fecha: fechaNorm,
      chiller1: {
        voltaje: parseJsonOrEmpty(chiller1Row.voltaje),
        nocturno: parseJsonOrEmpty(chiller1Row.nocturno),
        diurno: parseJsonOrEmpty(chiller1Row.diurno)
      },
      chiller3: {
        voltaje: parseJsonOrEmpty(chiller3Row.voltaje),
        nocturno: parseJsonOrEmpty(chiller3Row.nocturno),
        diurno: parseJsonOrEmpty(chiller3Row.diurno)
      }
    });

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${NOMBRE_EXCEL}"`);
    return res.send(excelBuffer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err?.message || 'error interno' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error('Error inicializando schema:', e);
    process.exit(1);
  });

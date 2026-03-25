const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const TEMPLATE_SHEET_CHILLER = "Dashboard Chiller´s";
const TEMPLATE_SHEET_VOLTAGE = 'Dashboard Voltaje';

const TEMPLATE_START_ROW_CHILLER = 8169;
const TEMPLATE_START_ROW_VOLTAGE = 7443;

const excelDateSerialFromYMD = (ymd) => {
  const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error('fecha inválida');
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const utc = Date.UTC(y, mo, d);
  const base = Date.UTC(1899, 11, 30);
  return (utc - base) / 86400000;
};

const approxEq = (a, b, eps = 1e-8) => {
  if (typeof a !== 'number' || typeof b !== 'number') return false;
  return Math.abs(a - b) <= eps;
};

const setCellNumber = (ws, addr, value) => {
  if (value === '' || value === null || value === undefined) return;
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(num)) return;
  ws[addr] = { t: 'n', v: num };
};

const setCellString = (ws, addr, value) => {
  if (value === '' || value === null || value === undefined) return;
  ws[addr] = { t: 's', v: String(value) };
};

function findOrAppendDayStartRowChiller(ws, targetDateSerial) {
  // Column A = fecha serial, Column B = hora (fracción).
  const TIME05 = 0.20833333333333334;

  const maxScan = 20000;
  for (let r = TEMPLATE_START_ROW_CHILLER; r < TEMPLATE_START_ROW_CHILLER + maxScan; r++) {
    const a = ws[`A${r}`]?.v;
    const b = ws[`B${r}`]?.v;
    if (a === targetDateSerial && typeof b === 'number' && approxEq(b, TIME05)) {
      return r;
    }
    if (a === undefined && b === undefined) {
      // si esta fila está vacía, asumimos que el siguiente bloque comienza aquí
      return r;
    }
  }
  return TEMPLATE_START_ROW_CHILLER;
}

function findOrAppendDayStartRowVoltage(ws, targetDateSerial) {
  const TIME05 = 0.20833333333333334;
  const maxScan = 20000;
  for (let r = TEMPLATE_START_ROW_VOLTAGE; r < TEMPLATE_START_ROW_VOLTAGE + maxScan; r++) {
    const a = ws[`A${r}`]?.v;
    const b = ws[`B${r}`]?.v;
    if (a === targetDateSerial && typeof b === 'number' && approxEq(b, TIME05)) {
      return r;
    }
    if (a === undefined && b === undefined) {
      return r;
    }
  }
  return TEMPLATE_START_ROW_VOLTAGE;
}

function findTemplateXlsPath() {
  const libsDir = path.join(__dirname, '..', 'libs');
  const files = fs.readdirSync(libsDir);
  const xls = files.find((f) => f.toLowerCase().endsWith('.xls'));
  if (!xls) throw new Error('No se encontró el template .xls en libs/');
  return path.join(libsDir, xls);
}

function getOrCreateMasterXlsPath() {
  const templatePath = findTemplateXlsPath();
  const templateFileName = path.basename(templatePath);
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const masterPath = path.join(dataDir, templateFileName);
  if (!fs.existsSync(masterPath)) {
    fs.copyFileSync(templatePath, masterPath);
  }
  return masterPath;
}

function backupWorkbookForDate(masterPath, fechaYMD) {
  const backupDir = path.join(path.dirname(masterPath), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const ext = path.extname(masterPath) || '.xls';
  const safeDate = String(fechaYMD || 'sin-fecha').replace(/[^0-9-]/g, '');
  const backupPath = path.join(backupDir, `registro-${safeDate}${ext}`);
  fs.copyFileSync(masterPath, backupPath);
  return backupPath;
}

function escribirDashboardChiller({ wsChiller, fechaYMD, chillerNo, datos }) {
  const fechaSerial = excelDateSerialFromYMD(fechaYMD);
  const dayStartRow = findOrAppendDayStartRowChiller(wsChiller, fechaSerial);

  const TIME_OFFSETS_CHILLER = {
    '05:00': 0,
    '06:30': 1,
    '07:30': 2,
    '08:30': 3,
    '10:00': 4,
    '11:00': 5,
    '14:00': 6,
    '16:00': 7,
    '18:00': 8,
    '19:00': 9,
    '20:00': 10,
    '21:00': 11,
    '22:00': 12,
    '23:00': 13,
    '00:00': 14
  };

  // fracciones exactas observadas en la plantilla (columna B)
  const TIME_FRACS_CHILLER = [
    0.20833333333333334, // 05:00
    0.2708333333333333,  // 06:30
    0.3125,               // 07:30
    0.3541666666666667,  // 08:30
    0.4166666666666667,  // 10:00
    0.4583333333333333,  // 11:00
    0.5833333333333334,  // 14:00
    0.6666666666666666,  // 16:00
    0.75,                  // 18:00
    0.7916666666666666,  // 19:00
    0.8333333333333334,  // 20:00
    0.875,                 // 21:00
    0.9166666666666666,  // 22:00
    0.9583333333333334,  // 23:00
    0.0                    // 00:00
  ];

  // Columnas destino por ítem (idx) para cada chiller
  const colByIdxCh1 = ['D', 'E', 'F', 'G', 'J', 'H', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];
  const colByIdxCh3 = ['U', 'V', 'W', 'X', 'AA', 'Y', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ'];
  const colByIdx = chillerNo === 1 ? colByIdxCh1 : colByIdxCh3;

  // Escribir fecha/hora para todo el bloque del día (A/B)
  // Esto asegura que si la sección estaba vacía, quede inicializada.
  for (let i = 0; i < TIME_FRACS_CHILLER.length; i++) {
    const row = dayStartRow + i;
    wsChiller[`A${row}`] = { t: 'n', v: fechaSerial };
    wsChiller[`B${row}`] = { t: 'n', v: TIME_FRACS_CHILLER[i] };
  }

  // Helper para escribir un valor en (col, fila hora-offset)
  const escribirValor = (idx, timeOffset, valor) => {
    if (idx === undefined || idx === null) return;
    const col = colByIdx[idx];
    if (!col) return;
    const row = dayStartRow + timeOffset;
    setCellNumber(wsChiller, `${col}${row}`, valor);
  };

  // Nocturno: noct_{idx}_{19h|...|00h}
  if (datos?.nocturno) {
    const mapNoct = {
      '19h': TIME_OFFSETS_CHILLER['19:00'],
      '20h': TIME_OFFSETS_CHILLER['20:00'],
      '21h': TIME_OFFSETS_CHILLER['21:00'],
      '22h': TIME_OFFSETS_CHILLER['22:00'],
      '23h': TIME_OFFSETS_CHILLER['23:00'],
      '00h': TIME_OFFSETS_CHILLER['00:00']
    };

    for (const [id, valor] of Object.entries(datos.nocturno)) {
      const m = id.match(/^noct_(\d+)_(19h|20h|21h|22h|23h|00h)$/);
      if (!m) continue;
      const idx = parseInt(m[1], 10);
      const timeKey = m[2];
      const timeOffset = mapNoct[timeKey];
      escribirValor(idx, timeOffset, valor);
    }
  }

  // Diurno:
  // En chiller1 usamos h0..h7 (05:00..18:00)
  // En chiller3 usamos h8..h15 (06:30..18:00)
  if (datos?.diurno) {
    const diurnoTimeByH_Ch1 = {
      0: TIME_OFFSETS_CHILLER['05:00'],
      1: TIME_OFFSETS_CHILLER['07:30'],
      2: TIME_OFFSETS_CHILLER['08:30'],
      3: TIME_OFFSETS_CHILLER['10:00'],
      4: TIME_OFFSETS_CHILLER['11:00'],
      5: TIME_OFFSETS_CHILLER['14:00'],
      6: TIME_OFFSETS_CHILLER['16:00'],
      7: TIME_OFFSETS_CHILLER['18:00']
    };
    const diurnoTimeByH_Ch3 = {
      8: TIME_OFFSETS_CHILLER['06:30'],
      9: TIME_OFFSETS_CHILLER['07:30'],
      10: TIME_OFFSETS_CHILLER['08:30'],
      11: TIME_OFFSETS_CHILLER['10:00'],
      12: TIME_OFFSETS_CHILLER['11:00'],
      13: TIME_OFFSETS_CHILLER['14:00'],
      14: TIME_OFFSETS_CHILLER['16:00'],
      15: TIME_OFFSETS_CHILLER['18:00']
    };
    const mapDiurno = chillerNo === 1 ? diurnoTimeByH_Ch1 : diurnoTimeByH_Ch3;

    for (const [id, valor] of Object.entries(datos.diurno)) {
      const m = id.match(/^diurno_(\d+)_h(\d+)$/);
      if (!m) continue;
      const idx = parseInt(m[1], 10);
      const h = parseInt(m[2], 10);
      const timeOffset = mapDiurno[h];
      if (timeOffset === undefined) continue;
      escribirValor(idx, timeOffset, valor);
    }
  }
}

function escribirDashboardVoltaje({ wsVoltage, fechaYMD, chillerNo, datos }) {
  const fechaSerial = excelDateSerialFromYMD(fechaYMD);
  const dayStartRow = findOrAppendDayStartRowVoltage(wsVoltage, fechaSerial);

  // Horas del dashboard voltaje (B) observadas en plantilla:
  // 05:00..23:00..00:00..01:00 => fracción 0.2083..0.9583..1..1.0416667
  const TIME_FRACS_V = [
    0.20833333333333334, // 05:00
    0.2708333333333333,  // 06:30
    0.3541666666666667,  // 08:30
    0.4583333333333333,  // 11:00
    0.5833333333333334,  // 14:00
    0.6666666666666666,  // 16:00
    0.75,                  // 18:00
    0.7916666666666666,  // 19:00
    0.8333333333333334,  // 20:00
    0.875,                 // 21:00
    0.9166666666666666,  // 22:00
    0.9583333333333334,  // 23:00
    1,                     // 00:00 (24:00)
    1.0416666666666667   // 01:00 (25:00)
  ];

  // Escribir fecha/hora para todo el bloque del día (A/B)
  for (let i = 0; i < TIME_FRACS_V.length; i++) {
    const row = dayStartRow + i;
    wsVoltage[`A${row}`] = { t: 'n', v: fechaSerial };
    wsVoltage[`B${row}`] = { t: 'n', v: TIME_FRACS_V[i] };
  }

  // Columnas por fase y chiller (según labels de fila 2)
  // chiller1: D(l12), E(l23), F(l31)
  // chiller3: M(l12), N(l23), O(l31)
  const phaseToColCh1 = { l12: 'D', l23: 'E', l31: 'F' };
  const phaseToColCh3 = { l12: 'M', l23: 'N', l31: 'O' };
  const phaseToCol = chillerNo === 1 ? phaseToColCh1 : phaseToColCh3;

  const momentListCh1 = [
    '05:00 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)',
    '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)'
  ];
  const momentListCh3 = [
    '06:30 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)',
    '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)'
  ];
  const momentList = chillerNo === 1 ? momentListCh1 : momentListCh3;

  const makeMomentKey = (momento) => momento.replace(/[^a-zA-Z0-9]/g, '_');

  // Mapa momentoKey -> offset dentro de TIME_FRACS_V
  // Usamos la correspondencia por tiempo (para asegurar que los offset sean correctos).
  const timeByMomento = {};
  const momentToTimeFrac = (mom) => {
    // Tomamos la hora del string "HH:MM (X)".
    const m = mom.match(/^(\d{2}):(\d{2})/);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    // Convertimos al "desde 05:00 base" según lo que ya vemos en la plantilla:
    // 00:00 => 1, 01:00 => 1.04166...
    // (Las horas posteriores a medianoche caen en el bloque "día + 1".)
    if (hh < 5) return 1 + hh / 24 + mm / 1440;
    return hh / 24 + mm / 1440;
  };

  for (const mom of momentList) {
    const key = makeMomentKey(mom);
    const frac = momentToTimeFrac(mom);
    timeByMomento[key] = frac;
  }

  // Invertir: timeFrac -> offset por igualdad aproximada
  const fracToOffset = new Map();
  for (let i = 0; i < TIME_FRACS_V.length; i++) {
    fracToOffset.set(TIME_FRACS_V[i], i);
  }

  const getOffsetForFrac = (frac) => {
    if (frac === null) return null;
    // match exacto si coincide; si no, busca aproximado
    for (let i = 0; i < TIME_FRACS_V.length; i++) {
      if (approxEq(TIME_FRACS_V[i], frac, 1e-7)) return i;
    }
    return null;
  };

  if (!datos?.voltaje) return;
  for (const [id, valor] of Object.entries(datos.voltaje)) {
    const m = id.match(/^v_ch(\d)_(.+)_(l12|l23|l31)$/);
    if (!m) continue;
    const ch = parseInt(m[1], 10);
    if (ch !== chillerNo) continue;
    const momentKey = m[2];
    const phase = m[3];
    const frac = timeByMomento[momentKey];
    const offset = getOffsetForFrac(frac);
    if (offset === null) continue;
    const col = phaseToCol[phase];
    const row = dayStartRow + offset;
    setCellNumber(wsVoltage, `${col}${row}`, valor);
  }
}

async function generarExcelDesdeTemplate({ fecha, chiller1, chiller3 }) {
  // Importante: para no perder la secuencia, leemos/escribimos un Excel master persistente.
  const masterPath = getOrCreateMasterXlsPath();
  const wb = XLSX.readFile(masterPath, { cellDates: false });

  const wsChiller = wb.Sheets[TEMPLATE_SHEET_CHILLER];
  const wsVoltage = wb.Sheets[TEMPLATE_SHEET_VOLTAGE];
  if (!wsChiller) throw new Error(`No existe hoja ${TEMPLATE_SHEET_CHILLER}`);
  if (!wsVoltage) throw new Error(`No existe hoja ${TEMPLATE_SHEET_VOLTAGE}`);

  escribirDashboardChiller({
    wsChiller,
    fechaYMD: fecha,
    chillerNo: 1,
    datos: chiller1
  });

  escribirDashboardChiller({
    wsChiller,
    fechaYMD: fecha,
    chillerNo: 3,
    datos: chiller3
  });

  escribirDashboardVoltaje({
    wsVoltage,
    fechaYMD: fecha,
    chillerNo: 1,
    datos: chiller1
  });

  escribirDashboardVoltaje({
    wsVoltage,
    fechaYMD: fecha,
    chillerNo: 3,
    datos: chiller3
  });

  const out = XLSX.write(wb, { bookType: 'xls', type: 'buffer' });
  fs.writeFileSync(masterPath, out);
  backupWorkbookForDate(masterPath, fecha);
  return out;
}

module.exports = {
  generarExcelDesdeTemplate
};

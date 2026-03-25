const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const TEMPLATE_SHEET_CHILLER = 'Dashboard Chiller';
const TEMPLATE_SHEET_VOLTAGE = 'Dashboard Voltaje';

const TEMPLATE_START_ROW_CHILLER = 8169;
const TEMPLATE_START_ROW_VOLTAGE = 7443;

const excelDateSerialFromYMD = (ymd) => {
  const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error('fecha invalida');
  const utc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const base = Date.UTC(1899, 11, 30);
  return (utc - base) / 86400000;
};

const approxEq = (a, b, eps = 1e-8) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= eps;

const setCellNumber = (ws, addr, value) => {
  if (value === '' || value === null || value === undefined) return;
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(num)) return;
  ws[addr] = { t: 'n', v: num };
};

function findOrAppendDayStartRowChiller(ws, targetDateSerial) {
  const TIME05 = 0.20833333333333334;
  for (let r = TEMPLATE_START_ROW_CHILLER; r < TEMPLATE_START_ROW_CHILLER + 20000; r += 1) {
    const a = ws[`A${r}`]?.v;
    const b = ws[`B${r}`]?.v;
    if (a === targetDateSerial && typeof b === 'number' && approxEq(b, TIME05)) return r;
    if (a === undefined && b === undefined) return r;
  }
  return TEMPLATE_START_ROW_CHILLER;
}

function findOrAppendDayStartRowVoltage(ws, targetDateSerial) {
  const TIME05 = 0.20833333333333334;
  for (let r = TEMPLATE_START_ROW_VOLTAGE; r < TEMPLATE_START_ROW_VOLTAGE + 20000; r += 1) {
    const a = ws[`A${r}`]?.v;
    const b = ws[`B${r}`]?.v;
    if (a === targetDateSerial && typeof b === 'number' && approxEq(b, TIME05)) return r;
    if (a === undefined && b === undefined) return r;
  }
  return TEMPLATE_START_ROW_VOLTAGE;
}

function findTemplateXlsPath() {
  const libsDir = path.join(__dirname, '..', 'libs');
  const files = fs.readdirSync(libsDir);
  const xls = files.find((f) => f.toLowerCase().endsWith('.xls'));
  if (!xls) throw new Error('No se encontro el template .xls en libs/');
  return path.join(libsDir, xls);
}

function findSheetName(workbook, target) {
  const normalizedTarget = target.toLowerCase();
  const found = workbook.SheetNames.find((name) => name.toLowerCase().includes(normalizedTarget));
  if (!found) throw new Error(`No existe hoja ${target}`);
  return found;
}

function keepOnlyDashboardSheets(workbook) {
  const chillerSheetName = findSheetName(workbook, TEMPLATE_SHEET_CHILLER);
  const voltageSheetName = findSheetName(workbook, TEMPLATE_SHEET_VOLTAGE);
  const newWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWorkbook, workbook.Sheets[chillerSheetName], chillerSheetName);
  XLSX.utils.book_append_sheet(newWorkbook, workbook.Sheets[voltageSheetName], voltageSheetName);
  return { workbook: newWorkbook, chillerSheetName, voltageSheetName };
}

function getOrCreateMasterXlsPath() {
  const templatePath = findTemplateXlsPath();
  const templateFileName = path.basename(templatePath);
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const masterPath = path.join(dataDir, templateFileName);
  if (!fs.existsSync(masterPath)) {
    const { workbook } = keepOnlyDashboardSheets(XLSX.readFile(templatePath, { cellDates: false }));
    const templateBuffer = XLSX.write(workbook, { bookType: 'xls', type: 'buffer' });
    fs.writeFileSync(masterPath, templateBuffer);
  }
  return masterPath;
}

function backupWorkbookForDate(masterPath, fechaYMD) {
  const backupDir = path.join(path.dirname(masterPath), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ext = path.extname(masterPath) || '.xls';
  const backupPath = path.join(backupDir, `registro-${String(fechaYMD).replace(/[^0-9-]/g, '')}${ext}`);
  fs.copyFileSync(masterPath, backupPath);
  return backupPath;
}

function escribirDashboardChiller({ wsChiller, fechaYMD, chillerNo, datos }) {
  const fechaSerial = excelDateSerialFromYMD(fechaYMD);
  const dayStartRow = findOrAppendDayStartRowChiller(wsChiller, fechaSerial);
  const TIME_OFFSETS = {
    '05:00': 0, '06:30': 1, '07:30': 2, '08:30': 3, '10:00': 4, '11:00': 5, '14:00': 6, '16:00': 7,
    '18:00': 8, '19:00': 9, '20:00': 10, '21:00': 11, '22:00': 12, '23:00': 13, '00:00': 14
  };
  const TIME_FRACS = [0.20833333333333334, 0.2708333333333333, 0.3125, 0.3541666666666667, 0.4166666666666667, 0.4583333333333333, 0.5833333333333334, 0.6666666666666666, 0.75, 0.7916666666666666, 0.8333333333333334, 0.875, 0.9166666666666666, 0.9583333333333334, 0.0];
  const colByIdxCh1 = ['D', 'E', 'F', 'G', 'J', 'H', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];
  const colByIdxCh3 = ['U', 'V', 'W', 'X', 'AA', 'Y', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ'];
  const colByIdx = chillerNo === 1 ? colByIdxCh1 : colByIdxCh3;

  TIME_FRACS.forEach((frac, index) => {
    const row = dayStartRow + index;
    wsChiller[`A${row}`] = { t: 'n', v: fechaSerial };
    wsChiller[`B${row}`] = { t: 'n', v: frac };
  });

  const writeValue = (idx, timeOffset, value) => {
    const col = colByIdx[idx];
    if (!col || timeOffset === undefined) return;
    setCellNumber(wsChiller, `${col}${dayStartRow + timeOffset}`, value);
  };

  const noctMap = { '19h': TIME_OFFSETS['19:00'], '20h': TIME_OFFSETS['20:00'], '21h': TIME_OFFSETS['21:00'], '22h': TIME_OFFSETS['22:00'], '23h': TIME_OFFSETS['23:00'], '00h': TIME_OFFSETS['00:00'] };
  Object.entries(datos?.nocturno || {}).forEach(([id, value]) => {
    const match = id.match(/^noct_(\d+)_(19h|20h|21h|22h|23h|00h)$/);
    if (!match) return;
    writeValue(parseInt(match[1], 10), noctMap[match[2]], value);
  });

  const diurnoMapCh1 = { 0: 0, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8 };
  const diurnoMapCh3 = { 8: 1, 9: 2, 10: 3, 11: 4, 12: 5, 13: 6, 14: 7, 15: 8 };
  const diurnoMap = chillerNo === 1 ? diurnoMapCh1 : diurnoMapCh3;

  Object.entries(datos?.diurno || {}).forEach(([id, value]) => {
    const match = id.match(/^diurno_(\d+)_h(\d+)$/);
    if (!match) return;
    const idx = parseInt(match[1], 10);
    const h = parseInt(match[2], 10);
    writeValue(idx, diurnoMap[h], value);
  });
}

function escribirDashboardVoltaje({ wsVoltage, fechaYMD, chillerNo, datos }) {
  const fechaSerial = excelDateSerialFromYMD(fechaYMD);
  const dayStartRow = findOrAppendDayStartRowVoltage(wsVoltage, fechaSerial);
  const TIME_FRACS = [0.20833333333333334, 0.2708333333333333, 0.3541666666666667, 0.4583333333333333, 0.5833333333333334, 0.6666666666666666, 0.75, 0.7916666666666666, 0.8333333333333334, 0.875, 0.9166666666666666, 0.9583333333333334, 1, 1.0416666666666667];
  const phaseToCol = chillerNo === 1 ? { l12: 'D', l23: 'E', l31: 'F' } : { l12: 'M', l23: 'N', l31: 'O' };
  const momentList = chillerNo === 1
    ? ['05:00 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)', '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)']
    : ['06:30 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)', '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)'];

  TIME_FRACS.forEach((frac, index) => {
    const row = dayStartRow + index;
    wsVoltage[`A${row}`] = { t: 'n', v: fechaSerial };
    wsVoltage[`B${row}`] = { t: 'n', v: frac };
  });

  const timeByMomento = {};
  momentList.forEach((mom) => {
    const timeMatch = mom.match(/^(\d{2}):(\d{2})/);
    if (!timeMatch) return;
    const hh = Number(timeMatch[1]);
    const mm = Number(timeMatch[2]);
    const frac = hh < 5 ? 1 + hh / 24 + mm / 1440 : hh / 24 + mm / 1440;
    timeByMomento[mom.replace(/[^a-zA-Z0-9]/g, '_')] = frac;
  });

  const getOffsetForFrac = (frac) => TIME_FRACS.findIndex((item) => approxEq(item, frac, 1e-7));

  Object.entries(datos?.voltaje || {}).forEach(([id, value]) => {
    const match = id.match(/^v_ch(\d)_(.+)_(l12|l23|l31)$/);
    if (!match || parseInt(match[1], 10) !== chillerNo) return;
    const frac = timeByMomento[match[2]];
    const offset = getOffsetForFrac(frac);
    const col = phaseToCol[match[3]];
    if (offset < 0 || !col) return;
    setCellNumber(wsVoltage, `${col}${dayStartRow + offset}`, value);
  });
}

async function generarExcelDesdeTemplate({ fecha, chiller1, chiller3 }) {
  const masterPath = getOrCreateMasterXlsPath();
  const { workbook: wb, chillerSheetName, voltageSheetName } = keepOnlyDashboardSheets(XLSX.readFile(masterPath, { cellDates: false }));
  const wsChiller = wb.Sheets[chillerSheetName];
  const wsVoltage = wb.Sheets[voltageSheetName];

  escribirDashboardChiller({ wsChiller, fechaYMD: fecha, chillerNo: 1, datos: chiller1 });
  escribirDashboardChiller({ wsChiller, fechaYMD: fecha, chillerNo: 3, datos: chiller3 });
  escribirDashboardVoltaje({ wsVoltage, fechaYMD: fecha, chillerNo: 1, datos: chiller1 });
  escribirDashboardVoltaje({ wsVoltage, fechaYMD: fecha, chillerNo: 3, datos: chiller3 });

  const out = XLSX.write(wb, { bookType: 'xls', type: 'buffer' });
  fs.writeFileSync(masterPath, out);
  backupWorkbookForDate(masterPath, fecha);
  return out;
}

module.exports = { generarExcelDesdeTemplate };

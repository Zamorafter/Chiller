const fs = require('fs');
const path = require('path');

const { generarExcelDesdeTemplate } = require('../server/excelGenerator');

const fecha = process.env.FECHA || new Date().toISOString().slice(0, 10);

const momentKey = (momento) => momento.replace(/[^a-zA-Z0-9]/g, '_');

// Copiamos los mismos momentos que usa el generador para que las keys coincidan.
const momentosVoltajeCh1 = [
  '05:00 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)',
  '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)'
];
const momentosVoltajeCh3 = [
  '06:30 (OP)', '08:30 (F)', '11:00 (F)', '14:00 (OP)', '16:00 (F)', '18:00 (OP)',
  '19:00 (OP)', '20:00 (F)', '21:00 (F)', '22:00 (OP)', '23:00 (F)', '00:00 (OP)', '01:00 (OP)'
];

const fases = ['l12', 'l23', 'l31'];

function buildVoltaje(chillerNo, momentos) {
  const voltaje = {};
  // Rellenamos valores para varios momentos (no hace falta todos).
  momentos.slice(0, 6).forEach((mom, i) => {
    fases.forEach((fase, j) => {
      voltaje[`v_ch${chillerNo}_${momentKey(mom)}_${fase}`] = Number((10 + i * 0.8 + j * 0.15).toFixed(1));
    });
  });

  // Un par extra para comprobar que también escribe los últimos bloques.
  const tail = momentos.slice(-3);
  tail.forEach((mom, k) => {
    fases.forEach((fase, j) => {
      voltaje[`v_ch${chillerNo}_${momentKey(mom)}_${fase}`] = Number((20 + k * 1.2 + j * 0.2).toFixed(1));
    });
  });

  // Campos "extra" que aparecen en la UI (y que el generador mapea a `operador_nocturno`).
  voltaje['op_nocturno'] = 'OP_' + chillerNo;
  voltaje['hora_apagado_' + chillerNo] = '01:00';
  return voltaje;
}

function buildNocturno() {
  const nocturno = {};
  // Generador: `noct_{idx}_{19h|...|00h}`
  const horas = ['19h', '20h', '21h', '22h', '23h', '00h'];
  for (let idx = 0; idx < 5; idx++) {
    horas.forEach((h, hi) => {
      nocturno[`noct_${idx}_${h}`] = Number((100 + idx * 2.5 + hi * 1.1).toFixed(1));
    });
  }
  nocturno['temp_amb_noct'] = 75;
  nocturno['tec_noct'] = 'TEC_' + 1;
  nocturno['elab_noct'] = 'ELAB';
  nocturno['sup_noct'] = 'SUP';
  nocturno['obs_noct'] = '';
  return nocturno;
}

function buildDiurno() {
  const diurno = {};
  // Generador: `diurno_{idx}_h{0..15}`.
  for (let idx = 0; idx < 5; idx++) {
    for (let h = 0; h < 8; h++) {
      diurno[`diurno_${idx}_h${h}`] = Number((200 + idx * 3.1 + h * 1.7).toFixed(1));
    }
  }
  diurno['temp_amb_diurno'] = 80;
  diurno['obs_diurno'] = '';
  diurno['tec_diurno'] = 'TEC_D';
  diurno['elab_diurno'] = 'ELAB_D';
  diurno['sup_diurno'] = 'SUP_D';
  return diurno;
}

async function main() {
  const chiller1 = {
    voltaje: buildVoltaje(1, momentosVoltajeCh1),
    nocturno: buildNocturno(),
    diurno: buildDiurno(),
  };

  const chiller3 = {
    voltaje: buildVoltaje(3, momentosVoltajeCh3),
    nocturno: buildNocturno(),
    diurno: buildDiurno(),
  };

  const excelBuffer = await generarExcelDesdeTemplate({ fecha, chiller1, chiller3 });

  const outPath = path.join(__dirname, '..', 'excel-generado-prueba.xls');
  fs.writeFileSync(outPath, excelBuffer);
  const stat = fs.statSync(outPath);
  console.log(`OK: Excel generado (${stat.size} bytes) en: ${outPath}`);
}

main().catch((e) => {
  console.error('ERROR generando excel:', e);
  process.exit(1);
});


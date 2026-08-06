// Utilidades de formato de fecha/hora para mostrar en la UI en español.
// Las fechas de Supabase llegan como 'YYYY-MM-DD' y las horas como 'HH:mm[:ss]'.

const MESES_CORTOS = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
];
const MESES_LARGOS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

// Parsea 'YYYY-MM-DD' a Date local (evita el corrimiento por zona horaria de new Date(str)).
export function parseDate(date: string | null | undefined): Date | null {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// 'JUL'
export function monthShort(date: string | null | undefined): string {
  const d = parseDate(date);
  return d ? MESES_CORTOS[d.getMonth()] : '';
}

// '12'
export function dayNumber(date: string | null | undefined): string {
  const d = parseDate(date);
  return d ? String(d.getDate()) : '';
}

// 'Jueves, 12 de Julio'
export function longDate(date: string | null | undefined): string {
  const d = parseDate(date);
  if (!d) return '';
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES_LARGOS[d.getMonth()]}`;
}

// '08:30' -> '8:30 AM'
export function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  let h = Number(hStr);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${suffix}`;
}

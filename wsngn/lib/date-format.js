// TODO: Intl.DateTimeFormat

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const shortMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** @type {(v: number) => string} */
function pad(v) {
  return v < 10 ? '0' + v : String(v);
}

/** @type {[string, (date: Date) => number | string][]} */
const rules = [
  ['YYYY', (date) => date.getUTCFullYear()],
  ['%DD', (date) => days[date.getUTCDay()]],
  ['%D', (date) => shortDays[date.getUTCDay()]],
  ['DD', (date) => pad(date.getUTCDate())],
  ['D', (date) => date.getUTCDate()],
  ['%MM', (date) => months[date.getUTCMonth()]],
  ['%M', (date) => shortMonths[date.getUTCMonth()]],
  ['MM', (date) => pad(date.getUTCMonth() + 1)],
  ['M', (date) => date.getUTCMonth() + 1],
  ['hh', (date) => pad(date.getUTCHours())],
  ['h', (date) => date.getUTCHours()],
  ['mm', (date) => pad(date.getUTCMinutes())],
  ['m', (date) => date.getUTCMinutes()],
  ['ss', (date) => pad(date.getUTCSeconds())],
  ['s', (date) => date.getUTCSeconds()],
];

/** @type {(date: Date, format: string) => string} */
export default function dateFormat(date, format) {
  let res = '';
  while (format) {
    const rule = rules.find(([s]) => format.startsWith(s));
    if (rule) {
      const [s, fn] = rule;
      res += fn(date);
      format = format.slice(s.length);
    } else {
      res += format[0];
      format = format.slice(1);
    }
  }
  return res;
}

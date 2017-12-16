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
  'June',
  'July',
  'Aug',
  'Sept',
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

function pad(v) {
  return v < 10 ? '0' + v : v;
}

module.exports = function(date, format) {
  return format
    .replace(/yyyy/, () => date.getUTCFullYear())
    .replace(/%D/, () => days[date.getUTCDay()])
    .replace(/%d/, () => shortDays[date.getUTCDay()])
    .replace(/dd/, () => pad(date.getUTCDate()))
    .replace(/d/, () => date.getUTCDate())
    .replace(/%M/, () => months[date.getUTCMonth()])
    .replace(/%m/, () => shortMonths[date.getUTCMonth()])
    .replace(/mm/, () => pad(date.getUTCMonth() + 1))
    .replace(/m/, () => date.getUTCMonth() + 1);
};

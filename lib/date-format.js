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

function pad(v) {
  return v < 10 ? '0' + v : v;
}

module.exports = function(date, format) {
  return format
    .replace(/YYYY/, () => date.getUTCFullYear())
    .replace(/%DD/, () => days[date.getUTCDay()])
    .replace(/%D/, () => shortDays[date.getUTCDay()])
    .replace(/DD/, () => pad(date.getUTCDate()))
    .replace(/D/, () => date.getUTCDate())
    .replace(/%MM/, () => months[date.getUTCMonth()])
    .replace(/%M/, () => shortMonths[date.getUTCMonth()])
    .replace(/MM/, () => pad(date.getUTCMonth() + 1))
    .replace(/M/, () => date.getUTCMonth() + 1)
    .replace(/hh/, () => pad(date.getUTCHours()))
    .replace(/h/, () => date.getUTCHours())
    .replace(/mm/, () => pad(date.getUTCMinutes()))
    .replace(/m/, () => date.getUTCMinutes())
    .replace(/ss/, () => pad(date.getUTCSeconds()))
    .replace(/s/, () => date.getUTCSeconds());
};

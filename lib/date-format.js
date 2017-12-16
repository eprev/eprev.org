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

module.exports = function(date, format) {
  return format
    .replace(/YYYY/, () => date.getUTCFullYear())
    .replace(/d/, () => date.getUTCDate())
    .replace(/#M/, () => months[date.getUTCMonth()]);
};

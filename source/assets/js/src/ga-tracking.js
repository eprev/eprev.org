window.addEventListener('error', function(e) {
  ga('send', 'event', 'JavaScript Error', e.message, e.filename ? (e.filename + ':' + e.lineno) : 'N/A', {nonInteraction: 1});
});
if (window.performance && document.hidden !== undefined) {
  var prevTimeStamp = performance.now();
  var timeOnPage = 0;
  var accTimeOnPage = function () {
    if (document.hidden) {
        timeOnPage += Math.round(performance.now() - prevTimeStamp);
    } else {
        prevTimeStamp = performance.now();
    }
  };
  document.addEventListener('visibilitychange', accTimeOnPage);
  window.addEventListener('unload', function () {
    accTimeOnPage();
    ga('send', 'timing', 'Engagement', 'Time On Page', timeOnPage, {transport: 'beacon'});
  });
}
document.body.addEventListener('click', (e) => {
  const target = e.target.closest('[data-ga-on=click]');
  if (target) {
    const data = target.dataset;
    ga('send', 'event', data.gaCategory, data.gaAction, data.gaLabel, data.gaValue);
  }
});


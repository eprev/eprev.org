document.body.addEventListener('click', (e) => {
  if (e.target.matches('[data-ga-on=click]')) {
    const data = e.target.dataset;
    ga('send', 'event', data.gaCategory, data.gaAction, data.gaLabel, data.gaValue);
  }
});

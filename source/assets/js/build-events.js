var source = new EventSource('/build-events');
source.onmessage = (event) => {
  if (event.data === 'done') {
    location.reload();
  }
};

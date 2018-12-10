if (window.Worker) {

  document
    .querySelectorAll('.search-control')
    .forEach(el => (el.disabled = false));

  const scriptEl = document.querySelector('[data-search-worker-href]');
  const worker = new Worker(scriptEl.dataset.searchWorkerHref);

  worker.addEventListener('error', (e) => {
    // TODO: Report to GA
    console.error(e);
  });
  let isReady = false;
  worker.addEventListener('message', (e) => {
    const { type } = e.data;
    console.info('main <-', e.data);
    if (type === 'ready' || type === 'updated') {
      isReady = true;
      search(searchInput.value);
    } else if (type === 'error') {
      searchContent.innerHTML = '<p><em>Sorry! Something went wrong…</em></p>';
    } else if (type === 'results') {
      const results = e.data.results;
      if (results.length) {
        searchContent.innerHTML = `<ol class="search-results__list">${results
          .map(
            r =>
              `<li class="search-results__item"><a href="${r.document.url}">${
                r.document.title
              }</a> <span>${r.document.date}</span></li>`,
          )
          .join('')}</ol>`;
      } else {
        searchContent.innerHTML = `<p><em>Nothing yet. Keep typing…</em></p>`;
      }
    }
  });

  const searchInput = document.querySelector('.search-input');
  searchInput.addEventListener('focus',() => worker.postMessage({type: 'init'}), { once: true });

  const searchContainer = document.createElement('div');
  searchContainer.className = 'page__content search-results search-hidden';
  document.querySelector('.page').appendChild(searchContainer);

  searchContainer.innerHTML = `<h1 class="search-results__header">Search results</h1><div class="search-results__content"><p><em>Loading…</em></div>`;
  const searchContent = searchContainer.querySelector('.search-results__content');

  function showSearchContainer() {
    document.querySelector('.page__content').classList.add('search-hidden');
    searchContainer.classList.remove('search-hidden');
  }

  function hideSearchContainer() {
    document
      .querySelectorAll('.search-hidden')
      .forEach(el => el.classList.remove('search-hidden'));
    searchContainer.classList.add('search-hidden');
  }

  document.querySelector('.search-toggle').addEventListener('click', e => {
    if (searchInput.classList.contains('search-input--visible')) {
      hideSearchContainer();
      searchInput.classList.remove('search-input--visible');
    } else {
      searchInput.classList.add('search-input--visible');
      searchInput.value = '';
      searchInput.focus();
    }
  });
  searchInput.addEventListener('input', e => search(e.target.value));

  function search(query) {
    if (query) {
      showSearchContainer();
      if (isReady) {
        searchContent.innerHTML = `<p><em>Nothing yet. Keep typing…</em></p>`;
        worker.postMessage({type: 'find', query});
      }
    } else {
      hideSearchContainer();
    }
  }
}

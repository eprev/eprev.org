// import { debounce } from './utils.js';

if (window.Worker) {
  document
    .querySelectorAll('.search-control')
    .forEach((el) => 'disabled' in el && (el.disabled = false));

  const workerUrl = /** @type {HTMLElement} */ (
    document.querySelector('[data-search-worker-href]')
  ).dataset.searchWorkerHref;

  if (workerUrl === undefined) throw new Error('Worker URL is required');

  const worker = new Worker(workerUrl);

  // TODO: goat events
  // worker.addEventListener('error', (e) => {
  //   ga(
  //     'send',
  //     'event',
  //     'JavaScript Error',
  //     e.message,
  //     e.filename ? e.filename + ':' + e.lineno : 'N/A',
  //     { nonInteraction: 1 },
  //   );
  // });

  let isReady = false;
  let currQuery;
  let currUrls = '-'; // Making sure we render the empty results for the first time

  // TODO: goat events
  // let gaQuery = debounce((query, results) => {
  //   if (query.length > 1) {
  //     // Do not report 1 character queries (after hitting the backspace)
  //     ga('send', 'event', 'Search', query, results);
  //   }
  // }, 500);

  /** @typedef {import('../search-worker.js').SearchResult} SearchResult */

  worker.addEventListener('message', (e) => {
    // console.debug('main received', e.data);
    if (!searchContent) return;
    const { type } = e.data;
    if (type === 'ready' || type === 'updated') {
      isReady = true;
      search(searchInput.value);
    } else if (type === 'error') {
      searchContent.innerHTML = '<p><em>Sorry! Something went wrong…</em></p>';
    } else if (type === 'results') {
      const results = /** @type {SearchResult[]} */ (e.data.results);
      const urls = results.map((r) => r.url).toString();
      // gaQuery(currQuery, results.length);
      if (urls !== currUrls) {
        currUrls = urls;
        if (results.length) {
          searchContent.innerHTML = `<ol class="search-results__list">${results
            .map(
              (r) =>
                `<li class="search-results__item"><a
                  href="${r.url}"
                  data-goatcounter-click="Search Results"
                  data-goatcounter-referrer="${r.url}"
                >${r.title}</a> <span>${r.date}</span></li>`,
            )
            .join('')}</ol>`;
        } else {
          searchContent.innerHTML = `<p><em>Nothing yet. Keep typing…</em></p>`;
        }
      }
    }
  });

  const searchInput = /** @type {HTMLInputElement} */ (
    document.querySelector('.search-input')
  );
  searchInput.addEventListener(
    'focus',
    () => worker.postMessage({ type: 'init' }),
    { once: true },
  );

  const searchContainer = /** @type {HTMLElement} */ (
    document.createElement('div')
  );
  searchContainer.className = 'page__content search-results search-hidden';
  document.querySelector('.page')?.appendChild(searchContainer);

  searchContainer.innerHTML = `<h1 class="search-results__header">Search results</h1><div class="search-results__content"><p><em>Loading…</em></div>`;
  const searchContent = searchContainer.querySelector(
    '.search-results__content',
  );

  function showSearchContainer() {
    document.querySelector('.page__content')?.classList.add('search-hidden');
    searchContainer.classList.remove('search-hidden');
  }

  function hideSearchContainer() {
    document
      .querySelectorAll('.search-hidden')
      .forEach((el) => el.classList.remove('search-hidden'));
    searchContainer.classList.add('search-hidden');
  }

  document.querySelector('.search-toggle')?.addEventListener('click', (e) => {
    if (searchInput.classList.contains('search-input--visible')) {
      hideSearchContainer();
      searchInput.classList.remove('search-input--visible');
    } else {
      searchInput.classList.add('search-input--visible');
      searchInput.value = '';
      searchInput.focus();
    }
  });
  searchInput.addEventListener('input', (e) =>
    search(/** @type {HTMLInputElement} */ (e.target).value),
  );

  /** @param {string} query */
  function search(query) {
    if (query) {
      showSearchContainer();
      if (isReady) {
        currQuery = query;
        // searchContent.innerHTML = `<p><em>Looking…</em></p>`;
        worker.postMessage({ type: 'search', query });
      }
    } else {
      hideSearchContainer();
    }
  }
}

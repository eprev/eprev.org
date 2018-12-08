document
  .querySelectorAll('.search-control')
  .forEach(el => (el.disabled = false));

const searchInput = document.querySelector('.search-input');

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

async function fetchIndex() {
  const response = await fetch('/index.json');
  if (response.ok) {
    const documents = await response.json();

    documents.forEach(doc => {
      const ngrams = {};
      for (let token in doc.tokens) {
        let count = doc.tokens[token];
        ngram(token).forEach(ng => {
          if (ngrams[ng]) {
            ngrams[ng] += count;
          } else {
            ngrams[ng] = count;
          }
        });
      }
      doc.tokens = ngrams;
    });

    const tokens = documents.reduce((acc, d) => {
      return reduce(Object.keys(d.tokens), acc);
    }, {});

    const N = documents.length;

    const idf = Object.keys(tokens).reduce((idf, t) => {
      idf[t] = Math.log(N / tokens[t]);
      return idf;
    }, {});

    documents.forEach(d => {
      for (let t in d.tokens) {
        d.tokens[t] *= idf[t];
      }
    });

    const searchIndex = {
      documents,
      idf,
    };

    localStorage.searchIndex = JSON.stringify(searchIndex);
    return searchIndex;
  } else {
    throw new Error('Failed to fetch the index');
  }
}

const searchIndex = new Promise((resolve, reject) => {
  searchInput.addEventListener(
    'focus',
    () => {
      if (!localStorage.searchIndex) {
        fetchIndex()
          .then(searchIndex => {
            resolve(searchIndex);
          })
          .catch(err => {
            reject(err);
          });
      } else {
        try {
          fetchIndex();
          resolve(JSON.parse(localStorage.searchIndex));
        } catch (err) {
          delete localStorage.searchIndex;
          reject(err);
        }
      }
    },
    { once: true },
  );
});

searchIndex
  .then(searchIndex => {
    const idf = searchIndex.idf;

    function search(query) {
      let results = [];
      if (query) {
        const vector = vectorize(query, idf);
        const tfMax = Object.values(vector).reduce(
          (max, c) => (c > max ? c : max),
          0,
        );
        for (let t in vector) {
          vector[t] = (0.5 + 0.5 * vector[t] / tfMax) * idf[t];
        }
        console.log(vector);

        if (Object.values(vector).length > 0) {
          results = searchIndex.documents
            .reduce((res, document) => {
              const score = cosineSimilarity(document.tokens, vector);
              if (score > 0) {
                res.push({
                  document,
                  score,
                });
              }
              return res;
            }, [])
            .filter(r => r.score > 0.1)
            .sort((a, b) => b.score - a.score);
        }
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
        showSearchContainer();
      } else {
        hideSearchContainer();
      }
    }

    searchInput.addEventListener('input', e => search(e.target.value));
    search(searchInput.value);
  })
  .catch(() => {
    searchInput.addEventListener('input', e => {
      if (e.target.value) {
        searchContent.innerHTML =
          '<p><em>Sorry! Something went wrong…</em></p>';
        showSearchContainer();
      } else {
        hideSearchContainer();
      }
    });
  });

function reduce(items, acc = {}) {
  return items.reduce((m, t) => {
    if (m[t]) {
      m[t] += 1;
    } else {
      m[t] = 1;
    }
    return m;
  }, acc);
}

function ngram(text, size = 3) {
  const res = [];
  text = '-' + text.padEnd(size - 2, '-') + '-';
  for (let i = 0; i < text.length - size + 1; ++i) {
    res.push(text.slice(i, i + size));
  }
  return res;
}

function vectorize(text, idf) {
  const tokens = text
    .replace(/’/g, "'")
    .split(/[^A-Za-z0-9'-]+/)
    .map(t => t.toLowerCase().replace(/['-]/g, ''))
    .filter(t => t.length > 1);
  const ngrams = tokens
    .reduce((acc, token) => acc.concat(ngram(token)), [])
    .filter(ng => ng in idf);
  return reduce(ngrams);
}

function vectorLength(v) {
  return Math.sqrt(v.reduce((sum, value) => sum + value * value, 0));
}

function cosineSimilarity(a, b) {
  const tokens = new Set(Object.keys(a).concat(Object.keys(b)));
  const product = [...tokens.values()].reduce(
    (sum, token) => sum + (a[token] || 0) * (b[token] || 0),
    0,
  );
  return (
    product / (vectorLength(Object.values(a)) * vectorLength(Object.values(b)))
  );
}


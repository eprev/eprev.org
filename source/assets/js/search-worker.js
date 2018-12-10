const idbStorage = (function(){
  const store = new Promise((resolve, reject) => {
    const req = indexedDB.open('idb-storage', 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => req.result.createObjectStore('objects');
  });

  function begin(mode, callback) {
    return store.then(db => new Promise((resolve, reject) => {
      let ret;
      const transaction = db.transaction('objects', mode);
      transaction.oncomplete = () => resolve(ret);
      transaction.onabort = transaction.onerror = () => reject(transaction.error);
      ret = callback(transaction.objectStore('objects'));
    }));
  }

  function get(key) {
    return begin('readonly', store => {
      return store.get(key);
    }).then(req => req.result);
  }

  function set(key, value) {
    return begin('readwrite', store => {
      store.put(value, key);
    });
  }

  function del(key) {
    return begin('readwrite', store => {
      store.delete(key);
    });
  }

  function clear() {
    return begin('readwrite', store => {
      store.clear();
    });
  }

  function keys() {
    return begin('readonly', store => {
      const keys = [];
      store.openKeyCursor().onsuccess = function () {
        if (this.result) {
          keys.push(this.result.key);
          this.result.continue();
        }
      };
      return keys;
    });
  }

  return {
    get,
    set,
    del,
    clear,
    keys,
  };
})();

let searchIndex;

self.addEventListener('message', (e) => {
  const { type } = e.data;
  console.info('worker <-', e.data);
  if (type === 'init') {
    searchIndex = getIndex();
    searchIndex.then(v => self.postMessage({type: 'ready'})).catch(err => self.postMessage({type: 'error', err}));
  } else if (type === 'find') {
    search(e.data.query).then(results => self.postMessage({type: 'results', results}))
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

    idbStorage.set('searchIndex', searchIndex);
    return searchIndex;
  } else {
    throw new Error('Failed to fetch the index');
  }
}

function getIndex() {
  return new Promise((resolve, reject) => {
    idbStorage.get('searchIndex').then(searchIndex => {
      if (searchIndex) {
        fetchIndex().then(() => self.postMessage({type: 'updated'}));
        resolve(searchIndex);
      } else {
        fetchIndex()
          .then(searchIndex => {
            resolve(searchIndex);
          })
          .catch(err => {
            reject(err);
          });
      }
    }).catch(err => {
      reject(err);
    });
  });
}

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

function search(query) {
  return searchIndex.then(searchIndex => {
    const idf = searchIndex.idf;
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
      return results;
    } else {
      return [];
    }
  });
}

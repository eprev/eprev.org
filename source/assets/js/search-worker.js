self.addEventListener('message', (e) => {
  // console.debug('search-worker received', e.data);
  const { type } = e.data;
  if (type === 'init') {
    getIndex()
      .then((v) => self.postMessage({ type: 'ready' }))
      .catch((err) => self.postMessage({ type: 'error', err }));
  } else if (type === 'search') {
    search(e.data.query).then((results) =>
      self.postMessage({ type: 'results', results }),
    );
  }
});

const storage = (function () {
  /** @type {Promise<IDBDatabase>} */
  const store = new Promise((resolve, reject) => {
    const req = indexedDB.open('idb-storage', 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => req.result.createObjectStore('objects');
  });

  /**
   * @param {"readonly" | "readwrite"} mode
   * @param {(store: IDBObjectStore) => unknown} callback
   */
  function begin(mode, callback) {
    return store.then(
      (db) =>
        new Promise((resolve, reject) => {
          let retVal;
          const transaction = db.transaction('objects', mode);
          transaction.oncomplete = () => resolve(retVal);
          transaction.onabort = transaction.onerror = () =>
            reject(transaction.error);
          retVal = callback(transaction.objectStore('objects'));
        }),
    );
  }

  /** @param {string} key */
  function get(key) {
    return begin('readonly', (store) => {
      return store.get(key);
    }).then((req) => req.result);
  }

  /**
   * @param {string} key
   * @param {any} value
   */
  function set(key, value) {
    return begin('readwrite', (store) => {
      store.put(value, key);
    });
  }

  return {
    get,
    set,
  };
})();

/** @typedef {ReturnType<buildIndex>} SearchIndex */

/** @type {() => SearchIndex} */
async function getIndex() {
  if (getIndex.index) {
    return getIndex.index;
  } else {
    let index = await storage.get('search-index');
    if (index) {
      // Update the index in background
      buildIndex().then(() => self.postMessage({ type: 'updated' }));
    } else {
      index = await buildIndex();
    }
    return (getIndex.index = index);
  }
}

/** @type {SearchIndex | undefined} */
getIndex.index = undefined;

const INDEX_NRGAM_SIZE = 3;

/** @type {(text: string, size: number) => string[]} */
function ngram(text, size = 2) {
  const seq = [];
  text = '-' + text.padEnd(size - 2, '-') + '-';
  for (let i = 0; i < text.length - size + 1; ++i) {
    seq.push(text.slice(i, i + size));
  }
  return seq;
}

/** @type {(items: string[], acc?: Record<string, number>, inc?: number) => Record<string, number>} */
function countItems(items, acc = {}, inc = 1) {
  return items.reduce((acc, item) => {
    acc[item] = acc[item] ? acc[item] + inc : inc;
    return acc;
  }, acc);
}

/** @typedef {import('../../search-index.tmpl.js').IndexedDocument} IndexedDocument */

async function buildIndex() {
  const response = await fetch('/index.json');

  if (response.ok) {
    /** @type {IndexedDocument[]} */
    const documents = await response.json();

    // Tokens is a hash where the keys are the words and the associated
    // values are the numbers of their occurrences. So, we need to iterate over
    // that list of words and generate n-gram (trigram) sequence from each of them.
    documents.forEach((doc) => {
      doc.tokens = Object.keys(doc.tokens).reduce((ngrams, tk) => {
        const freq = doc.tokens[tk];
        const seq = ngram(tk, INDEX_NRGAM_SIZE);
        return countItems(seq, ngrams, freq);
      }, {});
    });

    // Count the frequency of tokens across the set of documents
    const tokens = documents.reduce((tokens, doc) => {
      return countItems(Object.keys(doc.tokens), tokens);
    }, {});

    const n = documents.length;

    // TF–IDF weighting schemes No. 1 (https://en.wikipedia.org/wiki/Tf–idf)
    const idf = Object.keys(tokens).reduce((idf, tk) => {
      idf[tk] = Math.log(n / tokens[tk]);
      return idf;
    }, /** @type {Record<string, number>} */ ({}));

    documents.forEach((d) => {
      for (let tk in d.tokens) {
        d.tokens[tk] *= idf[tk];
      }
    });

    const index = {
      documents,
      idf,
    };

    storage.set('search-index', index);
    return index;
  } else {
    throw new Error('Failed to fetch the index');
  }
}

// TODO: vectors
/** @typedef {Record<string, number>} Vector */

/** @type {(text: string, idf: Record<string, number>) => Record<string, number>} */
function vectorize(text, idf) {
  // Tokenizer
  const tokens = text
    .replace(/’/g, "'")
    .split(/[^A-Za-z0-9'-]+/)
    .map((t) => t.toLowerCase().replace(/['-]/g, ''))
    .filter((t) => t.length > 1);
  // Generate n-grams (trigrams) from the tokens
  const ngrams = tokens
    .reduce(
      (ngrams, tk) => ngrams.concat(ngram(tk, INDEX_NRGAM_SIZE)),
      /** @type {string[]} */ ([]),
    )
    .filter((tk) => tk in idf); // filter "unknown" ngrams out
  return countItems(ngrams);
}

/** @type {(v: number[]) => number} */
function vectorLength(v) {
  return Math.sqrt(v.reduce((sum, value) => sum + value * value, 0));
}

/**
 * @param {Record<string, number>} a
 * @param {Record<string, number>} b
 * @returns {number}
 */
function cosineSimilarity(a, b) {
  const tokens = new Set(Object.keys(a).concat(Object.keys(b)));
  const product = [...tokens.values()].reduce(
    (sum, tk) => sum + (a[tk] || 0) * (b[tk] || 0),
    0,
  );
  const lenA = vectorLength(Object.values(a));
  const lenB = vectorLength(Object.values(b));
  return product / (lenA * lenB);
}

/** @typedef {Omit<IndexedDocument, 'tokens'> & { score: number}} SearchResult */

/** @param {string} query */
async function search(query) {
  const index = await getIndex();
  const idf = index.idf;
  /** @type {SearchResult[]} */
  let results = [];
  if (query) {
    const vector = vectorize(query, idf);
    const tfMax = Object.values(vector).reduce(
      (max, freq) => (freq > max ? freq : max),
      0,
    );
    // TF–IDF weighting schemes No. 1 (https://en.wikipedia.org/wiki/Tf–idf)
    for (let tk in vector) {
      vector[tk] = (0.5 + (0.5 * vector[tk]) / tfMax) * idf[tk];
    }

    if (Object.values(vector).length > 0) {
      results = index.documents
        .reduce((res, document) => {
          const score = cosineSimilarity(document.tokens, vector);
          if (score > 0.1) {
            res.push({
              title: document.title,
              date: document.date,
              url: document.url,
              score,
            });
          }
          return res;
        }, /** @type {SearchResult[]} */ ([]))
        .sort((a, b) => b.score - a.score);
    }
  }
  return results;
}

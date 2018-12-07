document.querySelectorAll('.search-control').forEach(el => el.disabled = false);

const searchInput = document.querySelector('.search-input');

const searchContainer = document.createElement('div');
searchContainer.className = 'page__content search-results search-hidden';
document.querySelector('.page').appendChild(searchContainer);

searchContainer.innerHTML = `<h1 class="search-results__header">Search results</h1><div class="search-results__content"><p><em>Loading…</em></div>`;
const searchContent = searchContainer.querySelector('.search-results__content');

function showSearchContainer() {
  document.querySelector('.page__content').classList.add('search-hidden');
  searchInput.classList.add('search-input--visible');
  searchContainer.classList.remove('search-hidden');
}

function hideSearchContainer() {
  document.querySelectorAll('.search-hidden').forEach(el => el.classList.remove('search-hidden'));
  searchInput.classList.remove('search-input--visible');
  searchContainer.classList.add('search-hidden');
}

document.querySelector('.search-toggle').addEventListener('click', (e) => {
  if (searchInput.classList.contains('search-input--visible')) {
    hideSearchContainer();
  } else {
    showSearchContainer();
    searchInput.focus();
  }
});

async function fetchIndex() {
  const response = await fetch('/index.json');
  if (response.ok) {
    const documents = await response.json();

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
  searchInput.addEventListener('focus', () => {
    if (!localStorage.searchIndex) {
      fetchIndex().then((searchIndex) => {
        resolve(searchIndex);
      }).catch((err) => {
        reject(err);
      });
    } else {
      try {
        fetchIndex();
        resolve(JSON.parse(localStorage.searchIndex));
      } catch(err) {
        delete localStorage.searchIndex;
        reject(err);
      }
    }
  }, {once: true});
});

searchIndex.then((searchIndex) => {
  const idf = searchIndex.idf;

  function search(query) {
    let results = [];
    if (query) {
      const vector = vectorize(query, idf);
      const tfMax = Object.values(vector).reduce((max, c) => c > max ? c : max, 0)
      for (let t in vector) {
        vector[t] = (0.5 + 0.5 * vector[t] / tfMax) * idf[t];
      }

      if (Object.values(vector).length > 0) {
        results = searchIndex.documents.reduce((res, document) => {
          const score = cosineSimilarity(document.tokens, vector);
          if (score > 0) {
            res.push({
              document,
              score,
            });
          }
          return res;
        }, []).sort((a, b) => b.score - a.score);
        searchContent.innerHTML = `<ol class="search-results__list">${results.map((r) => `<li class="search-results__item"><a href="${r.document.url}">${r.document.title}</a> <span>${r.document.date}</span></li>`).join('')}</ol>`;
      } else {
      searchContent.innerHTML = `<p><em>Nothing yet. Keep typing…</em></p>`;
  }
      showSearchContainer();
    } else {
      hideSearchContainer();
    }
  }

  searchInput.addEventListener('input', (e) => search(e.target.value));
  search(searchInput.value);
}).catch(() => {
  searchInput.addEventListener('input', (e) => {
    if (e.target.value) {
      searchContent.innerHTML = '<p><em>Sorry! Something went wrong…</em></p>';
      showSearchContainer();
    } else {
      hideSearchContainer();
    }
  });
});


// Porter stemmer in Javascript. Few comments, but it's easy to follow against the rules in the original
// paper, in
//
//  Porter, 1980, An algorithm for suffix stripping, Program, Vol. 14,
//  no. 3, pp 130-137,
//
// see also http://www.tartarus.org/~martin/PorterStemmer

// Release 1 be 'andargor', Jul 2004
// Release 2 (substantially revised) by Christopher McKenzie, Aug 2009
const stemmer = (function(){
  var step2list = {
    "ational" : "ate",
    "tional" : "tion",
    "enci" : "ence",
    "anci" : "ance",
    "izer" : "ize",
    "bli" : "ble",
    "alli" : "al",
    "entli" : "ent",
    "eli" : "e",
    "ousli" : "ous",
    "ization" : "ize",
    "ation" : "ate",
    "ator" : "ate",
    "alism" : "al",
    "iveness" : "ive",
    "fulness" : "ful",
    "ousness" : "ous",
    "aliti" : "al",
    "iviti" : "ive",
    "biliti" : "ble",
    "logi" : "log"
  },

  step3list = {
    "icate" : "ic",
    "ative" : "",
    "alize" : "al",
    "iciti" : "ic",
    "ical" : "ic",
    "ful" : "",
    "ness" : ""
  },

  c = "[^aeiou]",          // consonant
  v = "[aeiouy]",          // vowel
  C = c + "[^aeiouy]*",    // consonant sequence
  V = v + "[aeiou]*",      // vowel sequence

  mgr0 = "^(" + C + ")?" + V + C,               // [C]VC... is m>0
  meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$",  // [C]VC[V] is m=1
  mgr1 = "^(" + C + ")?" + V + C + V + C,       // [C]VCVC... is m>1
  s_v = "^(" + C + ")?" + v;                   // vowel in stem

  return function (w) {
    var 	stem,
      suffix,
      firstch,
      re,
      re2,
      re3,
      re4,
      origword = w;

    if (w.length < 3) { return w; }

    firstch = w.substr(0,1);
    if (firstch == "y") {
      w = firstch.toUpperCase() + w.substr(1);
    }

    // Step 1a
    re = /^(.+?)(ss|i)es$/;
    re2 = /^(.+?)([^s])s$/;

    if (re.test(w)) { w = w.replace(re,"$1$2"); }
    else if (re2.test(w)) {	w = w.replace(re2,"$1$2"); }

    // Step 1b
    re = /^(.+?)eed$/;
    re2 = /^(.+?)(ed|ing)$/;
    if (re.test(w)) {
      var fp = re.exec(w);
      re = new RegExp(mgr0);
      if (re.test(fp[1])) {
        re = /.$/;
        w = w.replace(re,"");
      }
    } else if (re2.test(w)) {
      var fp = re2.exec(w);
      stem = fp[1];
      re2 = new RegExp(s_v);
      if (re2.test(stem)) {
        w = stem;
        re2 = /(at|bl|iz)$/;
        re3 = new RegExp("([^aeiouylsz])\\1$");
        re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
        if (re2.test(w)) {	w = w + "e"; }
        else if (re3.test(w)) { re = /.$/; w = w.replace(re,""); }
        else if (re4.test(w)) { w = w + "e"; }
      }
    }

    // Step 1c
    re = /^(.+?)y$/;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(s_v);
      if (re.test(stem)) { w = stem + "i"; }
    }

    // Step 2
    re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = new RegExp(mgr0);
      if (re.test(stem)) {
        w = stem + step2list[suffix];
      }
    }

    // Step 3
    re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = new RegExp(mgr0);
      if (re.test(stem)) {
        w = stem + step3list[suffix];
      }
    }

    // Step 4
    re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
    re2 = /^(.+?)(s|t)(ion)$/;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(mgr1);
      if (re.test(stem)) {
        w = stem;
      }
    } else if (re2.test(w)) {
      var fp = re2.exec(w);
      stem = fp[1] + fp[2];
      re2 = new RegExp(mgr1);
      if (re2.test(stem)) {
        w = stem;
      }
    }

    // Step 5
    re = /^(.+?)e$/;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(mgr1);
      re2 = new RegExp(meq1);
      re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
      if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
        w = stem;
      }
    }

    re = /ll$/;
    re2 = new RegExp(mgr1);
    if (re.test(w) && re2.test(w)) {
      re = /.$/;
      w = w.replace(re,"");
    }

    // and turn initial Y back to y

    if (firstch == "y") {
      w = firstch.toLowerCase() + w.substr(1);
    }

    return w;
  }
})();

function reduce(items, acc = {}) {
  return items.reduce((m, t) => {
    if (m[t]) {
        m[t] += 1;
    } else {
      m[t] = 1;
    }
    return m;
  }, acc);
};

function vectorize(text, idf) {
  const tokens = text
    .split(/[\W]+/)
    .map(t => stemmer(t.toLowerCase()))
    .filter(t => t.length > 1 && t in idf);
  return reduce(tokens);
}

function vectorLength(v) {
  return Math.sqrt(
    v.reduce((sum, value) => sum + value * value, 0)
  );
}

function cosineSimilarity(a, b) {
  const tokens = new Set(Object.keys(a).concat(Object.keys(b)));
  const product = [...tokens.values()].reduce((sum, token) => sum + (a[token] || 0) * (b[token] || 0), 0);
  return product / ( vectorLength(Object.values(a)) * vectorLength(Object.values(b)) );
}

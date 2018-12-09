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

export function get(key) {
  return begin('readonly', store => {
    return store.get(key);
  }).then(req => req.result);
}

export function set(key, value) {
  return begin('readwrite', store => {
    store.put(value, key);
  });
}

export function del(key) {
  return begin('readwrite', store => {
    store.delete(key);
  });
}

export function clear() {
  return begin('readwrite', store => {
    store.clear();
  });
}

export function keys() {
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

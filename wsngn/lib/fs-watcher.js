import fs from 'fs';
import path from 'path';

/** @type {(dirname: string, fn: (pathname: string) => void) => void} */
function readdir(dirname, fn) {
  return fs.readdirSync(dirname, { encoding: 'utf8' }).forEach((filename) => {
    // Do not include "hidden" files
    if (filename.startsWith('.')) return;
    const pathname = path.join(dirname, filename);
    const stats = fs.statSync(pathname);
    if (stats.isDirectory()) {
      readdir(pathname, fn);
    } else {
      fn(pathname);
    }
  });
}

/** @type {(pathname: string, listener: (closed: boolean) => void) => void} */
function watch(pathname, listener) {
  const watcher = fs.watch(
    pathname,
    { encoding: 'utf8' },
    (eventType, filename) => {
      let closed = false;
      if (eventType === 'rename') {
        const exists = fs.existsSync(pathname);
        if (exists) {
          // If the file has re-appeared in the directory, its inode changed.
          closed = true;
          watcher.close();
        }
      }
      listener(closed);
    },
  );
}

/** @type {(dirname: string, listener: (pathname: string) => void) => void} */
export default function (dirname, listener) {
  readdir(dirname, (pathname) => {
    watch(pathname, function watchListener(closed) {
      listener(pathname);
      if (closed) {
        // The file was renamed and no longer being watched, watch it again.
        watch(pathname, watchListener);
      }
    });
  });
}

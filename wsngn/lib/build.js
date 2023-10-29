#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { Site } from '../lib/site.js';
import { render } from '../lib/template.js';
import getConfig from '../lib/config.js';
import colorize from '../lib/colorize.js';
import debug from '../lib/debug.js';

/** @typedef {import("./config.js").Config} Config */

const workingDir = process.cwd();
const config = getConfig(
  (await import(path.join(workingDir, 'config.js'))).default,
);

/** @type {(src: string, dest: string) => void} */
function copy(src, dest) {
  createdir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

/** @type {(dest: string, content: string) => void} */
function write(dest, content) {
  createdir(path.dirname(dest));
  fs.writeFileSync(dest, content, { encoding: 'utf8' });
}

/** @param {string} dirname */
function createdir(dirname) {
  dirname.split(path.sep).reduce((rel, dirname) => {
    const pathname = path.join(rel, dirname);
    if (!fs.existsSync(pathname)) {
      fs.mkdirSync(pathname);
    }
    return pathname;
  }, '/');
}

/** @typedef {import('./site.js').Document} Document */
/** @typedef {(destination: string, page: Document, template?: string) => Promise<void>} GenerateFunction */
/** @typedef {(payload: {generate: GenerateFunction, site: Site, config: Config}) => Promise<void>} PluginFunction */

async function build() {
  const site = new Site(config.site);

  console.time('Time');
  if (!debug.level) {
    process.stdout.write('Building... ');
  }

  const __build_id__ = process.hrtime().join('');

  debug.info('Sanning...');
  await site.build();

  /** @type {GenerateFunction} */
  async function generate(destination, page, template = undefined) {
    debug.info('Write', destination);
    if (page.__name__ && page.mime == 'application/javascript') {
      page.content = await render(path.join(config.src, page.__name__), {
        __build_id__,
        __name__: page.__name__,
        env: config.env,
        site,
      });
    }
    let content;
    if (template) {
      const context = {
        __build_id__,
        env: config.env,
        site,
        page,
      };
      content = await render(template, context);
    } else {
      content = page.content;
    }
    if (content !== undefined) {
      write(path.join(config.dest, destination), content);
    }
  }

  async function processPlugins() {
    const dirname = path.join(workingDir, 'plugins');
    if (fs.existsSync(dirname)) {
      const plugins = fs.readdirSync(dirname, { encoding: 'utf8' });
      for (const filename of plugins) {
        if (filename.endsWith('.plugin.js')) {
          const pathname = path.join(dirname, filename);
          /** @type {{default: PluginFunction}} */
          const { default: fn } = await import(pathname);
          if (typeof fn === 'function') {
            debug.info('Load', filename);
            await fn({ generate, site, config });
          } else {
            throw new Error(
              `build: '${pathname}' does not export {PluginFunction}`,
            );
          }
        }
      }
    }
  }

  debug.info('Plugins...');
  await processPlugins();

  debug.info('Files...');
  Object.keys(site.files).forEach((pathname) => {
    const doc = site.files[pathname];
    const destination = doc.pathname.endsWith('/')
      ? doc.pathname + 'index.html'
      : doc.pathname;
    // TODO: doc.isTemplate
    if (doc.content || doc.mime == 'application/javascript') {
      generate(destination, doc, doc.layout);
    } else {
      debug.info('Copy', doc.__name__);
      copy(
        path.join(config.src, pathname),
        path.join(config.dest, destination),
      );
    }
  });

  if (!debug.level) {
    console.log(colorize('OK', 'green'));
  }
  console.timeEnd('Time');
}

import EventEmitter from 'events';
const buildEvents = new EventEmitter();

let isBuilding = false;
async function safeBuild() {
  if (isBuilding) return;
  isBuilding = true;
  try {
    await build();
    buildEvents.emit('success');
  } catch (e) {
    buildEvents.emit('error', e);
    console.error(e);
  } finally {
    isBuilding = false;
  }
}

const watching = process.argv.length === 3 && process.argv[2] === '--server';

if (watching) {
  const { default: fsWatcher } = await import('./fs-watcher.js');
  let to = setTimeout(safeBuild, 50);
  fsWatcher(config.src, (_filename) => {
    clearTimeout(to);
    to = setTimeout(safeBuild, 50);
  });
  fsWatcher(path.join(workingDir, 'templates'), (_filename) => {
    clearTimeout(to);
    to = setTimeout(safeBuild, 50);
  });
  const { default: createServer } = await import('./server.js');
  await createServer(config, buildEvents);
  console.log('Watching...');
} else {
  build();
}

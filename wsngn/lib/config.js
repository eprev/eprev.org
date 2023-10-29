/** @typedef {{
 *   serverUrl: string,
 *   env?: "production" | string,
 *   src: string,
 *   dest: string,
 *   site: {
 *     url: string,
 *     [key: string]: unknown,
 *   },
 *   [key: string]: unknown,
 * }} Config */

/**
 * @param {unknown} config
 * @returns {config is Config}
 */
function isConfig(config) {
  if (typeof config !== 'object' || config === null) {
    throw new Error('config: object is required');
  }

  if (typeof config['serverUrl'] !== 'string') {
    throw new Error('config: {string} serverUrl is required');
  }

  if (config['env'] !== undefined && typeof config['env'] !== 'string') {
    throw new Error('config: {string} env is expected');
  }

  if (typeof config['src'] !== 'string') {
    throw new Error('config: {string} src is required');
  }

  if (typeof config['dest'] !== 'string') {
    throw new Error('config: {string} dest is required');
  }

  if (typeof config['site'] === 'object') {
    if (typeof config['site']['url'] !== 'string') {
      throw new Error('config: {string} site.url is required');
    }
  }
  return true;
}

/** @type {(config: unknown) => Config} */
export default function getConfig(config) {
  if (isConfig(config)) {
    return config;
  } else {
    throw new Error('config: invalid');
  }
}

import { properties } from '@eprev/wsngn';

/** @type {import('@eprev/wsngn').TemplateFunction} */
export default async ({
  html,
  render,
  read,
  site: _site,
  page: _page,
  env,
  url,
}) => {
  const manifest = properties(read('../../manifest.txt'));
  /** @typedef {import('../../config.js').ConfigSite} ConfigSite */
  const site = /** @type {import('@eprev/wsngn').Site<ConfigSite>} */ (_site);
  const page = /** @type {import('@eprev/wsngn').Document} */ (_page);

  return html`<!DOCTYPE html>
    <html lang="en">
      <meta charset="utf-8" />
      <title>
        ${page.title ? `${page.title} – ${site.config.title}` : site.config.title}
      </title>
      <link rel="shortcut icon" href="/assets/4-eyed-32x32.png" />
      <link
        rel="preload"
        as="font"
        type="font/woff2"
        href="/assets/fonts/merriweathersans-light.woff2"
        crossorigin
      />
      <link
        rel="preload"
        as="font"
        type="font/woff2"
        href="/assets/fonts/merriweathersans-bold.woff2"
        crossorigin
      />
      <link
        rel="preload"
        as="font"
        type="font/woff2"
        href="/assets/fonts/merriweathersans-lightitalic.woff2"
        crossorigin
      />
      ${manifest
        ? `<style>${read(
            '../../static/assets-bundles/' + manifest['main.css'],
          )}</style>`
        : `<link href="/assets/css/main.css" rel="stylesheet">`}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        name="description"
        content="${page.description || site.config.description}"
      />
      <link
        rel="alternate"
        type="application/atom+xml"
        title="Feed"
        href="${url('/atom.xml')}"
      />
      <link rel="canonical" href="${url(page.pathname)}" />
      ${page.draft ? '<meta name="robots" content="none">' : ''}
      ${page.description
        ? html` <meta property="og:url" content="${url(page.pathname)}" />
            <meta property="og:title" content="${page.title}" />
            <meta property="og:site_name" content="${site.config.title}" />
            <meta property="og:type" content="article" />
            <meta property="og:description" content="${page.description}" />
            ${page.shareImage
              ? html`
                  <meta
                    property="og:image"
                    content="${url(page.pathname + page.shareImage)}"
                  />
                  <meta
                    name="twitter:image"
                    content="${url(page.pathname + page.shareImage)}"
                  />
                  <meta name="twitter:card" content="summary_large_image" />
                `
              : ''}
            <meta name="twitter:creator" content="@${site.config.twitter}" />
            <meta name="twitter:title" content="${page.title}" />
            <meta name="twitter:description" content="${page.description}" />`
        : ''}
      <script
        src="${manifest
          ? '/assets-bundles/' + manifest['main.js']
          : '/assets/js/main.js'}"
        type="module"
        data-search-worker-href="${manifest
          ? '/assets-bundles/' + manifest['search-worker.js']
          : '/assets/js/search-worker.js'}"
      ></script>
      ${env === 'development'
        ? '<script src="/assets/js/build-events.js" type="module"></script>'
        : ''}
      <body>
        ${env == 'production' && '<script data-goatcounter="https://eprev_org.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>'}
        <div class="page">
          <div class="page__sidebar">
            <div class="page__user-picture-story">
              ${page.pathname == '/'
                ? `<h1 class="page__user-name">@${site.config.twitter}</h1>`
                : `<a class="page__user-name" href="/">@${site.config.twitter}</a>`}
              <div class="page__user-picture">
                ${read('../icons/4-eyed.svg')}
              </div>
              <div class="page__user-story">
                ${site.config.description} I’m on
                <a href="https://twitter.com/eprev">Twitter</a>,
                <a href="https://github.com/eprev">GitHub</a> and
                <a href="https://unsplash.com/@eprev">Unsplash</a>.
              </div>
            </div>
            <ul class="page__nav">
              <li>${page.pathname == '/' ? 'Home' : '<a href="/">Home</a>'}</li>
              <li>
                ${page.pathname == '/archive/'
                  ? 'Archive'
                  : '<a href="/archive/">Archive</a>'}
              </li>
              <li>
                ${page.pathname == '/tags/'
                  ? 'Tags'
                  : '<a href="/tags/">Tags</a>'}
              </li>
              <li>
                <a href="/atom.xml" class="rss"
                  >Feed ${read('../icons/rss.svg')}</a
                >
              </li>
            </ul>
            <button
              disabled
              class="search-toggle search-control"
              data-ga-on="click"
              data-ga-category="Click"
              data-ga-action="Search Button"
              aria-label="Search"
            >
              ${read('../icons/search.svg')}
            </button>
            <input
              disabled
              type="text"
              class="search-input search-control"
              placeholder="Search"
              data-ga-on="click"
              data-ga-category="Click"
              data-ga-action="Search Input"
            />
          </div>
          <div class="page__content">`; // prettier-ignore
};

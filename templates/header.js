html`
<!doctype html>
<html lang="en">
  <meta charset="utf-8">
  <title>${page.title ? `${page.title} – ${site.title}` : site.title}</title>
  <link rel="shortcut icon" href="${url('icon.png')}">
  <link href="${url('main.css')}" rel="stylesheet">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${page.description || site.description}">
  <script src="${url('main.js')}" type="module"></script>
  <link rel="alternate" type="application/atom+xml" title="Feed" href="${url(
    'atom.xml',
  )}">
  <link rel="canonical" href="${url(page.url)}">
  ${
    page.description
      ? html`
    <meta property="og:url" content="${url(page.url)}">
    <meta property="og:title" content="${page.title}">
    <meta property="og:site_name" content="${site.title}">
    <meta property="og:type" content="article">
    <meta property="og:description" content="${page.description}">
    ${
      page.ogImage
        ? html`
      <meta property="og:image" content="${url(page.url + page.ogImage)}">
      <meta name="twitter:image" content="${url(page.url + page.ogImage)}">
      <meta name="twitter:card" content="summary_large_image">
      `
        : ''
    }
    <meta name="twitter:creator" content="@{{ site.twitter }}">
    <meta name="twitter:title" content="{{ page.title }}">
    <meta name="twitter:description" content="{{ page.description }}">
  `
      : ''
  }
  <body>
`;
<!--
tags:
  - worth-watching
  - javascript
  - seo
share-image: og-preview.png
description: Insights on how Googlebot renders JavaScript websites and best practicies to build indexable web applications.
gh-issue-id: 42
-->

# Deliver search-friendly web applications

In their “[Deliver search-friendly JavaScript-powered websites](https://youtu.be/PFwUbgvpdaQ)” presentation at Google I/O 2018, Tom Greenaway and John Mueller shared details on how Google’s search crawler works and talked about the best practicies to build indexable sites and web applications.

- There are over 130 trillon (10&#x00B9;&#x00B2;) documents on the web (as of Jully 2016).
- Googlebot no longer crawls hashbang URLs.
- The rendering of JavaScript websites in Google is deferred until resources become available to process the content.
- It is recommended to detect Googlebot on the server by user-agent string and send a complete “dynamically rendered” HTML document back.
- There are tools available for dynamic rendering, such as Puppeteer or Rendertron.
- The Googlebot uses Chrome 41 to render JavaScript websites. That version of Chrome was released in 2015 and does not support ES6.
- Search Console allows you to view HTML rendered by Googlebot and review JavaScript exceptions and console logs.
- If your website uses lazy loading images, add a `noscript` tag around a normal image tag to make sure Googlebot will pick them up.
- Googlebot does not index images referenced through CSS.
- Googlebot crawls and renders pages in a stateless way, it does not support Service workers, local and session storage, Cookies, Cache API and etc.
- Google plans to bring rendering closer to crawling and indexing and make Googlebot use a modern version of Chrome.

<!--: class="post__content-list" -->

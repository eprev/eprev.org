<!--
title: How to detect if CSS transforms are supported on&nbsp;SVG
date: 2017.01.05
layout: post
tags:
  - svg
  - html
  - javascript
description: How to check whether or not the browser supports CSS transforms on SVG elements.
ghIssueId: 15
-->

If you're reading this, then apparently you already know that [IE and Edge don’t support CSS transformations
on SVG](https://developer.microsoft.com/en-us/microsoft-edge/platform/status/supportcsstransformsonsvg/)
and neither apply CSS transitions. Moreover, SVG animations might not be an option, since [Chrome
deprecated SMIL](https://groups.google.com/a/chromium.org/forum/#!topic/blink-dev/5o0yiO440LM%5B1-25%5D)
in favor of CSS animations. How come? Probably you’re thinking now of using CSS when it’s available
and falling back to SVG `transform` attribute.

<!-- Read More -->

So how to check whether or not the browser supports CSS transforms on SVG elements? I came up with
the following approach:

```javascript
const supportsCSSTransformsOnSVG = (() => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 2 2');
  Object.assign(svg.style, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '2px',
    height: '2px',
  });
  svg.innerHTML = '<rect width="1" height="1" style="transform: translate(1px, 1px)"/>';
  document.body.appendChild(svg);
  const result = document.elementFromPoint(1, 1) !== svg;
  svg.parentNode.removeChild(svg);
  return result;
})();
```

Which can be used later on:

```javascript
if (supportsCSSTransformsOnSVG) {
  el.style.transform = `translate(${dx}px, ${dy}px)`;
} else {
  el.setAttribute('transform', `translate(${dx} ${dy})`);
}
```


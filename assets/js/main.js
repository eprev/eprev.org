import eyed from './src/eyed.js';
import './src/comments.js';
import scrollbar from './src/scrollbar.js';
import './src/search.js';

eyed(
  /** @type {HTMLElement} */ (document.querySelector('.page__user-picture')),
);
scrollbar();

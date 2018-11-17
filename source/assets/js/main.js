import eyed from './src/eyed.js';
import './src/comments.js';
import scrollbar from './src/scrollbar.js';

eyed( document.querySelector('.page__user-picture') );
scrollbar();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}

import './vendor/fontfaceobserver';
import './src/polyfills';
import { eyed } from './src/eyed';

eyed( document.querySelector('.page__user-picture') );

Promise.all(
  ['Merriweather Sans', 'Merriweather'].map(name => {
    (new FontFaceObserver(name)).load()
  })
).then(() => {
  document.documentElement.classList.add('fonts-loaded');
  sessionStorage.setItem('fonts-loaded', 'yes');
});


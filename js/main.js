import './vendor/fontfaceobserver';
import './src/polyfills';
import { eyed } from './src/eyed';

eyed( document.querySelector('.page__user-picture') );

Promise.all([
  (new FontFaceObserver('Merriweather Sans', {weight: 300})).load(),
  (new FontFaceObserver('Merriweather Sans', {weight: 700})).load(),
  (new FontFaceObserver('Merriweather Sans', {weight: 300, style: 'italic'})).load(),
  (new FontFaceObserver('Merriweather', {weight: 400})).load(),
]).then(() => {
  sessionStorage.fontsLoaded = 'yes';
  document.documentElement.classList.add('fonts-loaded');
});


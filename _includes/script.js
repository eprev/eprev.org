/* exported loadCSS */

var requestAnimationFrame = window.requestAnimationFrame || /* Chrome, IE 10 */ // jshint ignore:line
    window.webkitRequestAnimationFrame || /* Safari */
    window.msRequestAnimationFrame || /* IEMobile 10 */
    window.mozRequestAnimationFrame || /* Firefox 22- */
    function (callback) { window.setTimeout(callback, 1000 / 60); }; /* Android */

requestAnimationFrame(function () {
    document.querySelector('.page__inner').classList.toggle('page__inner_swiped');
});

function loadCSS(href) {
    requestAnimationFrame(function() {
        var link = document.createElement('link'),
            head = document.getElementsByTagName('head')[0];
        link.rel = 'stylesheet';
        link.href = href;
        head.parentNode.insertBefore(link, head);
    });
}

/* global Hammer: true */

// var el = document.createElement('div');
// var matchesSelector = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector || el.oMatchesSelector;

// function closest(el, selector) {
//     var p = el;
//     while (p !== document.documentElement) {
//         if (matchesSelector.call(p, selector)) {
//             return p;
//         }
//         p = p.parentNode;
//     }
//     return null;
// }

var getCSSProperty = (function() {
    "use strict";

    var prefix = {
            'Webkit': '-webkit-',
            'Moz'   : '-moz-',
            'ms'    : '-ms-',
            'O'     : '-o-'
        },
        cache = {};

    return function (property, index) {
        index = index ? 1 : 0;

        if (property in cache) {
            return cache[property][index];
        }

        var style = (document.body || document.documentElement).style,
            camelcase = property.replace(/(-)(\w)?/g, function(s, d, w) {
                return w ? w.toUpperCase() : '';
            });

        if (typeof style[camelcase] == 'string') {
            return (cache[property] = [camelcase, property])[index];
        }

        camelcase = camelcase.charAt(0).toUpperCase() + camelcase.substr(1);
        for (var i in prefix) {
            if (prefix.hasOwnProperty(i)) {
                var s = i + camelcase;
                if (typeof style[s] == 'string') {
                    return (cache[property] = [s, prefix[i] + property])[index];
                }
            }
        }

        cache[property] = [];
        return undefined;
    };

})();

var hasTransform3D = (function() {
    var el = document.createElement('div'),
        transform = getCSSProperty('transform'),
        v;

    document.body.insertBefore(el, null);

    if (transform) {
        el.style[transform] = 'translate3d(1px,1px,1px)';
        v = window.getComputedStyle(el).getPropertyValue(getCSSProperty('transform', true));
    }

    document.body.removeChild(el);

    return (v && v.length > 0 && v !== 'none');
})();

var startX,
    pageInner = document.querySelector('.page__inner'),
    pageArrow = document.querySelector('.page__arrow');

pageArrow.addEventListener('click', function () {
    pageInner.style[getCSSProperty('transform')] = '';
    if (pageInner.classList.contains('page__inner_swiped')) {
        pageInner.classList.remove('page__inner_swiped');
        pageArrow.classList.remove('page__arrow_alt');
    } else {
        pageInner.classList.add('page__inner_swiped');
        pageArrow.classList.add('page__arrow_alt');
    }
});

Hammer.NO_MOUSEEVENTS = true;

var hiPageInner = Hammer(pageInner, {
    stop_browser_behavior: null,
    drag_min_distance: 1,
    drag_block_horizontal: true,
    drag_lock_to_axis: true
}).on('touch', function (/*evt*/) {
    // if (closest(evt.target, 'pre code')) {
    //     evt.gesture.stopDetect();
    // } else {
        this.classList.remove('page__inner_animated');
        startX = this.classList.contains('page__inner_swiped') ? document.documentElement.clientWidth * 0.8 : 0;
    // }
}).on('drag', function (evt) {
    var gesture = evt.gesture;
    if (gesture) {
        if (!Hammer.utils.isVertical(gesture.direction)) {
            var deltaX = gesture.deltaX;
            if (startX && gesture.direction === 'right' || !startX && gesture.direction === 'left') {
                deltaX *= 0.2;
            }
            this.style[getCSSProperty('transform')] = hasTransform3D ? ('translate3d(' + (startX + deltaX) +'px, 0, 0)') : ('translate(' + (startX + deltaX) +'px, 0)');
        }
    }
}).on('release', function (evt) {
    var gesture = evt.gesture;
    if (!Hammer.utils.isVertical(gesture.direction)) {
        var maxX = document.documentElement.clientWidth * 0.8,
            accept = Math.abs(gesture.deltaX) > (maxX / 2) || gesture.velocityX > 0.7;
        this.classList.add('page__inner_animated');
        if (accept) {
            if (gesture.direction === 'right') {
                this.style[getCSSProperty('transform')] = '';
                this.classList.add('page__inner_swiped');
            } else {
                this.style[getCSSProperty('transform')] = hasTransform3D ? 'translate3d(0, 0, 0)' : 'translate(0, 0)';
                this.classList.remove('page__inner_swiped');
            }
        } else {
            this.style[getCSSProperty('transform')] = hasTransform3D ? 'translate3d(' + startX + 'px, 0, 0)' : 'translate(' + startX + ', 0)';
        }
    }
});

var sidebarHidden = false;
function resizeHanlder() {
    sidebarHidden = window.innerWidth <= 767;
    hiPageInner.enable(sidebarHidden);
}

window.addEventListener('resize', resizeHanlder);
resizeHanlder();

(function () {
    var toScrollHandler;
    function scrollHandler() {
        if (sidebarHidden) {
            if (toScrollHandler) {
                clearTimeout(toScrollHandler);
            }
            var scrollTop = window.pageYOffset;
            if (scrollTop === 0 || (window.innerHeight + scrollTop) >= document.body.scrollHeight) {
                moveSidebar();
            } else {
                toScrollHandler = setTimeout(moveSidebar, 500);
            }
        }
    }

    function rhythm(y) {
        return y - y % 26;
    }

    var sidebarInner = document.querySelector('.page__sidebar__inner');
    var prevY = 0;
    function moveSidebar() {
        var scrollTop = window.pageYOffset;
        var innerHeight = window.innerHeight;
        var sidebarHeight = sidebarInner.clientHeight;
        if (typeof scrollTop !== 'undefined' && typeof innerHeight !== 'undefined') {
            var Y;
            if (innerHeight < sidebarHeight) {
                var diff = scrollTop + innerHeight - sidebarHeight;
                if (diff <= 0) {
                    Y = 0;
                } else {
                    Y = rhythm(diff);
                }
            } else {
                Y = rhythm(scrollTop);
            }
            if (Math.abs(Y - prevY) > innerHeight || Y === 0) {
                sidebarInner.style[getCSSProperty('transform')] = 'translateY(' + Y + 'px)';
                prevY = Y;
            }
        }
    }

    window.addEventListener('scroll', scrollHandler);
})();

// document.addEventListener('keyup', function (e) {
//     if (hiPageInner.enabled) {
//         if (e.keyCode === 39) {
//             pageInner.classList.add('page__inner_swiped');
//         } else if (e.keyCode === 37) {
//             pageInner.classList.remove('page__inner_swiped');
//         }
//     }
// });

(function() {
    if (screen.width >= 768) {
        window.addEventListener('load', function () {
            var images = document.querySelectorAll('img[data-src]');
            for (var i = 0, c = images.length; i < c; i++) {
                var image = images[i];
                image.src = image.getAttribute('data-src');
            }
        });
    }
})();

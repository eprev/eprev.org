/* global $:true */
//
// Playing Cards
// 2010 (c) Anton Eprev http://eprev.org/
//

var supportRotation = $.browser.webkit || $.browser.mozilla,
    supportOpacity = $.support.opacity;

if (typeof Array.prototype.indexOf == 'undefined') {
    Array.prototype.indexOf = function(el , start) {
        for (var i = (start || 0); i < this.length; i++) {
            if (this[i] == el) {
                return i;
            }
        }
        return -1;
    };
}

 // Shuffles the elements
 $.fn.shuffle = function () {
    var elems = this.get(),
    random = function(max) {
        return Math.floor(Math.random() * max);
    },
    shuffled = $.map(this.get(), function () {
        var rand = random(elems.length), el = $(elems[rand]).clone()[0];
        elems.splice(rand, 1);
        return el;
    });
    this.each(function(i){
        $(this).replaceWith($(shuffled[i]));
    });
    return $(shuffled);
 };

function doMagic()
{
    var
        showDelay = 750, // Animation durations
        hideDelay = 500;

    var
        tableWidth   = $('.card-table').width(),
        tableHeight  = $('.card-table').height(),
        cardWidth    = $('.card-wrapper:first').width(),
        cardHeight   = $('.card-wrapper:first').height(),
        zoomRatio    = 2,
        cardsCount   = $('.card-wrapper').length,
        wrapperWidth = Math.round(tableWidth / (cardsCount + 1)),
        cardZ        = cardsCount + 1, // Z-index for choosen card

        midIdx    = Math.round(cardsCount / 2), // Index of the middle card
        midIdxLog = Math.log(midIdx);

    function adjustIndex(idx)
    {
        var ai = midIdx - Math.abs(idx + 1 - midIdx);
        if (0 == cardsCount % 2 && idx >= midIdx) {
            ai++;
        }
        return ai;
    }

    function offsetByIndex(idx) {
        var ai = adjustIndex(idx);
        var left = (idx + 1) * wrapperWidth - cardWidth / 2;
        var top  = cardHeight / 4 * (midIdxLog - Math.log(ai));
        return {left: left, top: top};
    }

    function degByIndex(idx) {
        var ai = adjustIndex(idx);
        var deg  = Math.round(30 * (midIdxLog - Math.log(ai)));
        if (idx <= ai) {
            deg = -deg;
        }
        return deg.toString();
    }

    function spreadOut(delay) {
        $('.card-wrapper').each(function(idx, el) {
            $(el).css('z-index', cardsCount - idx); // Cards overlapping
            var offset = offsetByIndex(idx), props = {top: offset.top, left: offset.left};
            if (supportOpacity) {
                props.opacity = 1;
            }
            if (supportRotation) {
                var deg = degByIndex(idx);
                props.rotate = deg + 'deg';
            }
            if (delay) {
                setTimeout(function () {
                    $(el).show().animate(props, {duration: showDelay, easing: 'easeInOutCubic'});
                }, 50 * idx);
            } else {
                $(el).animate(props, {duration: showDelay, easing: 'easeInOutCubic'});
            }
        });
        // Set up the click handler after the shuffle
        setTimeout(function () {
            $('.card-wrapper').click(clickHandler);
        }, showDelay);
    }

    function clickHandler (e) {
        if ($('.card-back:visible', this).length) {
            $('.card-wrapper').unbind('click', clickHandler);
            showIn(this);
        } else {
            $('.card-wrapper').unbind('click', clickHandler);
            hideOut(this);
        }
    }

    function showIn(wrapper) {
        var props = {top: (tableHeight - cardHeight), left: tableWidth / 2 - wrapperWidth - 1}; // Move to the center bottom of the table
        if (supportRotation) {
            props.rotate = '0deg';
        }
        $(wrapper).clearQueue().animate(props,
            {duration: showDelay, complete: function () {
                $(wrapper).css('z-index', cardZ);
            }}
        );
        $('.card-back', wrapper).animate(
            // Hide back-side
            {width: 0, left: cardWidth / 2},
            {duration: showDelay, easing: 'easeInCubic', complete: function () {
                $(this).hide();
                $(this).siblings('.card-front').show().css('left', cardWidth / 2).animate(
                    // Show front-side
                    {width: cardWidth, left: 0},
                    {duration: showDelay, easing: 'easeOutCubic'}
                 ).animate(
                    // Zoom in
                    {width: cardWidth * zoomRatio, height: cardHeight * zoomRatio, top: -(cardHeight * (zoomRatio - 1)), left: -(cardWidth / 2 * (zoomRatio - 1))},
                    {duration: showDelay, easing: 'easeOutCubic', complete: function () {
                        // Show mask
                        $('.mask').width($(document).width()).height($(document).height())
                            .css('z-index', cardZ - 1).show()
                            .animate({opacity: 0.7}, showDelay);
                        // Set up the click handler back
                        $('.card-wrapper').click(clickHandler);
                    }}
                );
            }}
        );
    }

    function hideOut(wrapper) {
        // Hide mask
        $('.mask').animate({opacity: 0}, {duration: hideDelay, complete: function () {
            $(this).hide();
        }});
        // Get wrapper index
        var idx = $('.card-wrapper').index(wrapper);
        var offset = offsetByIndex(idx);
        $('.card-front', wrapper).animate(
            // Zoom out
            {left: 0, top: 0, width: cardWidth, height: cardHeight},
            {duration: hideDelay, easing: 'easeInCubic'}
        ).animate(
            // Hide front-side
            {width: 0, left: cardWidth / 2},
            {duration: hideDelay, easing: 'easeInCubic', complete: function () {
                $(this).hide();
                var props = {left: offset.left, top: offset.top};
                if (supportRotation) {
                    props.rotate = degByIndex(idx) + 'deg';
                }
                $(wrapper).css('z-index', cardsCount - idx); // Restore z-index
                $(this).siblings('.card-back').animate( // Show back-side
                    {width: cardWidth, left: 0},
                    {duration: hideDelay, easing: 'easeOutCubic'}
                );
                $(wrapper).animate(props, {duration: hideDelay, complete: shuffle}); // And move back to the initial position
            }}
        );
    }

    function shuffle()
    {
        var counter = 0, props = {top: 0, left: (tableWidth - cardWidth) / 2};
        if (supportRotation) {
            props.rotate = '0deg';
        }
        $('.card-wrapper').clearQueue().animate(props,  // Gather cards together
            {duration: showDelay, easing: 'easeInOutCubic', complete: function () {
                if (++counter == cardsCount) {
                    // Shuffle and spreadOut out again
                    $('.card-wrapper').shuffle();
                    spreadOut(false);
                }
            }}
        );
    }

    // Let's do the magic!

    // First shuffle
    $('.card-wrapper').shuffle();
    // Moving wrappers to the start position
    $('.card-wrapper').offset({
        top: tableHeight - cardHeight,
        left: (tableWidth - cardWidth) / 2
    });
    if (supportOpacity) {
        $('.card-wrapper').css('opacity', 0);
    }

    // SpreadOut out
    spreadOut(true);

}

$(function()  {

    // Hides toolbar in iPhone
    if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i)) {
        setTimeout(scrollTo, 0, 0, 1);
    }

    // Preloading images
    var images = [],
        loaded = 0;

    $('.card-wrapper img').each(function () {
        var src = $(this).attr('src');
        if (images.indexOf(src) < 0) {
            images.push(src);
        }
    });

    var imgOnLoad = function () {
        loaded++;
        var width = (loaded / c) * ($('.loader').width() - 2);
        $('.loader-inner').width(width);
        if (loaded == images.length) {
            $('.loader').hide();
            doMagic();
        }
    };
    for (var i = 0, c = images.length; i < c; i++) {
        var img = new Image();
        img.onload = imgOnLoad;
        img.src = images[i];
    }
});

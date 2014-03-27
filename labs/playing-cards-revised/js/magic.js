/* global $:true, move:true */

/**
 * Playing Cards Revised
 * 2013 (c) Anton Eprev http://eprev.org/
 */

function doMagic()
{
    var
        showDelay = 750, // Animation durations
        hideDelay = 500;

    var
        $cardWrapper = $('.card-wrapper'),
        $cardTable   = $('.card-table'),
        tableWidth   = $cardTable.width(),
        tableHeight  = $cardTable.height(),
        cardWidth    = $cardWrapper.width(),
        cardHeight   = $cardWrapper.height(),
        originY      = tableHeight - cardHeight,
        originX      = (tableWidth - cardWidth) / 2,
        zoomRatio    = 2,
        cards        = $cardWrapper.get(),
        cardsCount   = cards.length,
        wrapperWidth = Math.round(tableWidth / (cardsCount + 1)),
        cardZ        = cardsCount + 1,             // Z-index for choosen card
        midIdx       = Math.round(cardsCount / 2), // Index of the middle card
        midIdxLog    = Math.log(midIdx);

    $('.mask').css('z-index', cardZ - 1);

    function shuffleArray (o) {
        for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x) {}
        return o;
    }

    function adjustIndex(idx) {
        var ai = midIdx - Math.abs(idx + 1 - midIdx);
        if (0 === cardsCount % 2 && idx >= midIdx) {
            ai++;
        }
        return ai;
    }

    function offsetByIndex(idx) {
        var ai = adjustIndex(idx);
        var left = (idx + 1) * wrapperWidth - cardWidth / 2;
        var top  = cardHeight / 4 * (midIdxLog - Math.log(ai));
        return {dx: left - originX, dy: top - originY};
    }

    function degByIndex(idx) {
        var ai = adjustIndex(idx);
        var deg  = Math.round(30 * (midIdxLog - Math.log(ai)));
        if (idx <= ai) {
            deg = -deg;
        }
        return deg;
    }

    function spreadOut(delay) {
        $.each(cards, function(idx, el) {
            // Cards overlapping
            $(el).css('z-index', cardsCount - idx);
            var offset = offsetByIndex(idx);
            setTimeout(function () {
                move(el)
                    .set('opacity', 1)
                    .translate(offset.dx, offset.dy)
                    .rotate(degByIndex(idx))
                    .duration(showDelay)
                    .ease('in-out')
                    .end();
            }, delay ? 50 * idx : 0);
        });
        // Set up the click handler after the shuffle
        setTimeout(function () {
            $cardWrapper.click(clickHandler);
        }, showDelay);
    }

    function clickHandler () {
        if ($(this).hasClass('card-wrapper-open')) {
            $cardWrapper.unbind('click', clickHandler).removeClass('card-wrapper-open');
            hideOut(this);
        } else {
            $cardWrapper.unbind('click', clickHandler).addClass('card-wrapper-open');
            showIn(this);
        }
    }

    function showIn(wrapper) {
        // Move to the center bottom of the table
        var top = (tableHeight - cardHeight),
            left = tableWidth / 2 - wrapperWidth - 1;
        move(wrapper)
            .duration(showDelay)
            .translate(left - originX, top - originY)
            .rotate(0)
            .end(function () {
                $(wrapper).css('z-index', cardZ);
            });
        // Hide back-side
        move($('.card-back', wrapper).get(0))
            .transform('rotateY(90deg)')
            .duration(showDelay)
            .ease('ease-in-cubic')
            .end(function () {
                // Show front-side
                move($(this.el).siblings('.card-front').get(0))
                    .ease('ease-out-cubic')
                    .transform('rotateY(0)')
                    .end(function() {
                        // Zoom
                        move(this.el)
                            .scale(zoomRatio)
                            .ease('ease-out-cubic')
                            .duration(showDelay)
                            .end(function () {
                                // Show mask
                                var mask = $('.mask')
                                    .css('visibility', 'visible')
                                    .get(0);
                                move(mask)
                                    .set('opacity', 0.7)
                                    .duration(showDelay)
                                    .end();
                                $(wrapper).addClass('card-wrapper-zoomed');
                                // Set up the click handler back)
                                $cardWrapper.click(clickHandler);
                            });
                    });
            });
    }

    function hideOut(wrapper) {
        // Hide mask
        move('.mask')
            .set('opacity', 0)
            .duration(hideDelay)
            .end(function () {
                $(this.el).css('visibility', 'hidden');
            });
        // Get wrapper index
        var idx = cards.indexOf(wrapper),
            offset = offsetByIndex(idx);
        $(wrapper).removeClass('card-wrapper-zoomed');
        // Zoom out
        move($('.card-front', wrapper).get(0))
            .scale(1)
            .duration(hideDelay)
            .ease('ease-in-cubic')
            .end(function () {
                // Hide front-side
                move(this.el)
                    .transform('rotateY(-90deg)')
                    .duration(hideDelay)
                    .ease('ease-in-cubic')
                    .end(function () {
                        // Show back-side
                        move($(this.el).siblings('.card-back').get(0))
                            .transform('rotateY(0)')
                            .duration(hideDelay)
                            .ease('ease-out-cubic')
                            .end();
                        // Restore z-index
                        $(wrapper).css('z-index', cardsCount - idx);
                        // And move back to the initial position
                        setTimeout(function () {
                            move(wrapper)
                                .translate(offset.dx, offset.dy)
                                .rotate(degByIndex(idx))
                                .duration(hideDelay)
                                .end(shuffle);
                        }, 0);
                    });
            });
    }

    function shuffle()
    {
        var counter = 0,
            dx = (tableWidth - cardWidth) / 2 - originX,
            dy = -originY;
        $.each(cards, function () {
            // Move to the top center
            move(this)
                .translate(dx, dy)
                .rotate(0)
                .duration(showDelay)
                .ease('ease-in-cubic')
                .end(function () {
                    if (++counter == cardsCount) {
                        // Shuffle and spreadOut out again
                        shuffleArray(cards);
                        spreadOut(false);
                    }
                });
        });
    }

    // Let's do the magic!

    // First shuffle
    // $('.card-wrapper').shuffle();
    shuffleArray(cards);

    // Moving wrappers to the start position
    $('.card-wrapper').css({
        top: originY,
        left: originX
    });

    // SpreadOut out
    spreadOut(true);

}

$(function () {

    // Preloading images
    var images = [],
        loaded = 0,
        $loader = $('.loader'),
        loaderWidth = $loader.width();

    $('.card-wrapper img').each(function () {
        var src = $(this).attr('src');
        if (images.indexOf(src) < 0) {
            images.push(src);
        }
    });

    var total = images.length,
        imgOnLoad = function () {
            loaded++;
            var width = (loaded / total) * (loaderWidth - 2);
            $('.loader-inner').width(width);
            if (loaded == total) {
                $loader.hide();
                doMagic();
            }
        };

    for (var i = 0; i < total; i++) {
        var img = new Image();
        img.onload = imgOnLoad;
        img.src = images[i];
    }

});

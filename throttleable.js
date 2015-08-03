/* Copyright (c) 2015 Adam Anthony
 * Licensed under The MIT License (MIT) - http://opensource.org/licenses/MIT
 * THROTTLEABLE - Reduces impact of scroll binding by exposing a new event to bind to - "scrollable"
 * Version 1.1 - first release
 */
(function ($) {
    $.extend({ remoteCount: 0 });

    $.CreateThrottle = function (t, settings, callback) {
        var config = {
            throttle: 5,
            scrollTop: 0,
            scroll: false
        };
        $.extend(config, settings);

        var control = {
            init: function (evt, settings) {

                //init the scroll event
                $(t).on('scroll', control.Throttle);
            },

            Throttle: function (evt, settings) {
                var scrollTop = $(window).scrollTop(),
					offset = $('body').children().first().offset().top;

                if (scrollTop > (config.scrollTop + config.throttle) || scrollTop < (config.scrollTop - config.throttle) || scrollTop == 0) {
                    //update config values
                    config.scrollTop = scrollTop;
                    config.scroll = true;

                    //fire custom event
                    $(document).trigger('scrollable');
                }
                else if (config.scroll) {
                    config.scroll = false;
                    //fire custom event
                    $(document).trigger('unscrollable');
                }
            }
        };

        control.init();

        t.control = control;
        t.config = config;

        return t;
    };

    $.fn.Throttle = function (p, callback) {
        return this.each(function () {

            $.CreateThrottle(this, p, callback)

        });
    };
    $.fn.Destroy = function () {

        return this.each(function () {
            if (this.control) {
                this.control.destroy();
            }
        });

    };

    $(window).Throttle();

}(jQuery));

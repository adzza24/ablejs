/* Copyright (c) 2015 Adam Anthony
 * Licensed under The MIT License (MIT) - http://opensource.org/licenses/MIT
 * THROTTLABLE - Plugin to make reduce the imapct of scroll event binding by providing a new throttled event
 * Version 2.0 - Added a timer to ensure a scroll event always fires after scrolling, even if the throttle point has not been reached
 */

(function ($) {
    $.extend({ remoteCount: 0 });

    $.Throttlable = function (t, settings, callback) {

        //"t" is the window

        var config = {
            throttle: 5,
            scrollTop: 0,
            scroll: false,
            throttleevent: "scroll_throttle",
            chokeevent: "scroll_choke",
            timer: null,
            delay: 200
        };
        $.extend(config, settings);

        var control = {
            init: function () {
                //init the scroll event
                $(t).on('scroll', control.throttle);
            },
            throttle: function () {
                var scrollTop = $(window).scrollTop();
                if (scrollTop > (config.scrollTop + config.throttle) || scrollTop < (config.scrollTop - config.throttle) || scrollTop == 0) {
                    //console.log("scroll throttle");
                    control.release(scrollTop);
                    return;
                }
                else if (config.scroll) {
                    //console.log("scroll choke");
                    control.choke();
                    return;
                }
                control.timer();
            },
            timer: function (clear) {
                clearTimeout(config.timer);
                if (clear) {
                    return;
                }
                config.timer = setTimeout(function () {
                    //console.log("scroll timer");
                    control.release();
                }, config.delay);
            },
            release: function (scrollTop) {
                //destory timeout
                control.timer(true);
                //update config values
                config.scrollTop = scrollTop || $(window).scrollTop();
                config.scroll = true;

                //fire custom event
                $(document).trigger(config.throttleevent);
            },
            choke: function () {
                config.scroll = false;
                //fire custom event
                $(document).trigger(config.chokeevent);
            }
        };

        control.init();

        t.control = control;
        t.config = config;

        return t;
    };

    $.fn.Throttle = function (p, callback) {
        return this.each(function () {

            $.Throttlable(this, p, callback)

        });
    };
    $.fn.Destroy = function () {

        return this.each(function () {
            if (this.control) {
                this.control.destroy();
            }
        });

    };
}(jQuery));

/* Copyright (c) 2015 Adam Anthony
 * Licensed under The MIT License (MIT) - http://opensource.org/licenses/MIT
 * THROTTLABLE - Plugin to make reduce the imapct of scroll event binding by providing a new throttled event
 * Version 2.0 - Added a timer to ensure a scroll event always fires after scrolling, even if the throttle point has not been reached
 * Version 2.1 - added destroy implementation
 * Version 2.2 - converted to a protoype model like other functions in able.js
 */

(function ($) {
    var Throttlable = function (t, settings, callback) {
        //"t" is the window
        this.config = $.extend({}, this.defaults, settings);
        this.elem = $(t);
        this.init();
    };
    Throttlable.prototype= {
        defaults: {
            throttle: 5,
            scrollTop: 0,
            scroll: false,
            throttleevent: "scroll_throttle",
            chokeevent: "scroll_choke",
            timer: null,
            failsafe: 200
        },
        init: function () {
            //init the scroll event
            var self = this;
            this.elem.on('scroll.throttlable', function () {
                self.throttle();
            });
        },
        throttle: function () {
            var scrollTop = $(window).scrollTop();
            if (scrollTop > (this.config.scrollTop + this.config.throttle) || scrollTop < (this.config.scrollTop - this.config.throttle) || scrollTop == 0) {
                //console.log("scroll throttle");
                this.release(scrollTop);
                return;
            }
            else if (this.config.scroll) {
                //console.log("scroll choke");
                this.choke();
                return;
            }
            //add a timeout as a fail safe
            this.timer();
        },
        timer: function (clear) {
            clearTimeout(this.config.timer);
            if (clear) {
                return;
            }
            this.config.timer = setTimeout(function () {
                this.release();
            }, this.config.failsafe);
        },
        release: function (scrollTop) {
            //destory timeout
            this.timer(true);
            //update config values
            this.config.scrollTop = scrollTop || $(window).scrollTop();
            this.config.scroll = true;

            //fire custom event
            $(document).trigger(this.config.throttleevent);
        },
        choke: function () {
            this.config.scroll = false;
            //fire custom event
            $(document).trigger(this.config.chokeevent);
        },
        destroy: function () {
            this.timer(true);
            this.elem.unbind('scroll.throttlable');
        }
    };

    $.fn.throttle = function (p, callback) {
        return this.each(function () {
            var elem = $(this),
                data = elem.data(),
                t = data.throttlable;
            t || elem.data('throttlable', t = new Throttlable(this, $.extend({}, typeof p == "object" ? p : {}, data), callback));
        });
    };
    $.fn.destroyThrottle = function () {
        return this.each(function () {
            var elem = $(this),
                data = elem.data(),
                t = data.throttlable;
            if (t) {
                t.destroy();
            }
        });
    };
}(jQuery));

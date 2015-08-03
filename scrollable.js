/* Copyright (c) 2015 Adam Anthony
 * Licensed under The MIT License (MIT) - http://opensource.org/licenses/MIT
 * SCROLLABLE - Plugin to make elements on a page respond to scroll events dependent on their position
 * Version 1.1
 * Version 1.2 - Added handling for directional indication classes
 */
(function ($) {

    var Scrollable = function (elem, settings) {

        this.options = $.extend({}, this.defaults, settings);
        this.options.target || (this.options.target = elem);
        this.options.target = $(this.options.target);
        this.elem = $(elem);
        this.offset = this.elem.offset().top;
        this.options.depth == 'bottom' && (this.options.depth = this.offset + this.elem.outerHeight());
        typeof this.options.depth == 'number' || (this.options.depth = this.offset);
        this.options.event = this.options.type;
        this.elem.trigger('initialised', { target: this.elem });
        this.init();
    };

    Scrollable.prototype = {

        defaults: {
            classname: 'scrolled',
            add: true,
            depth: false,
            reached: false,
            maxWidth: 0,
            width: true,
            scrolled: false,
            event: 'scroll',
            alive: true,
            contain: true,
            target: false,
            classUp: "up",
            classDown: "down",
            lastScroll: 0,
            directional: true,
            ambiguity: 50
        },

        init: function () {
            this.updateHeight();
            this.checkScroll();
            this.checkWidth();
            this.toggle();
        },

        toggle: function () {
            var elem = this.options.target && this.elem == this.options.target ? this.elem : this.elem.add(this.options.target);

            (this.options.reached && !this.options.scrolled && this.lock(elem)) || (!this.options.reached && this.options.scrolled && this.unlock(elem));

            this.options.directional && this.setDirection(elem);
        },

        setDirection: function (elem) {
            var direction = this.checkScroll(true);
            if (direction) {
                elem.removeClass(this.options.classUp).removeClass(this.options.classDown);
                direction == "up" && elem.addClass(this.options.classUp);
                direction == "down" && elem.addClass(this.options.classDown);
            }
        },

        lock: function (elem) {
            elem = elem || this.elem;
            this.options.alive && (this.options.add ? elem.addClass(this.options.classname) : elem.removeClass(this.options.classname));
            this.options.scrolled = true;
            this.elem.trigger('scrollable.lock');
            return true;
        },

        unlock: function (elem) {
            elem = elem || this.elem;
            this.options.alive && (this.options.add ? elem.removeClass(this.options.classname) : elem.addClass(this.options.classname));
            this.options.scrolled = false;
            this.updateHeight();
            this.elem.trigger('scrollable.unlock');
            return true;
        },

        checkWidth: function () {
            $(window).width() > this.options.maxWidth ? this.options.width = true : this.options.width = false;
            this.options.width ? !this.options.alive && this.revive() : this.kill();
        },

        checkScroll: function (direction) {
            var scroll = $(window).scrollTop();
            if (direction) {
                direction = scroll > this.options.lastScroll + this.options.ambiguity ? "down" : scroll < this.options.lastScroll - this.options.ambiguity ? "up" : false;
                direction && (this.options.lastScroll = scroll);
                return direction;
            }
            scroll > this.options.depth ? this.options.reached = true : this.options.reached = false;
        },

        updateHeight: function () {
            !this.options.scrolled &&
            (this._offset = this.offset,
            this.offset = this.elem.offset().top,
            this.options.depth !== this._offset || (this.options.depth = this.offset),
            this.checkWidth());
        },

        kill: function () {
            this.options.scrolled && this.unlock();
            this.options.alive = false;
            return true;
        },

        revive: function () {
            this.options.alive = true;
            this.options.scrolled && this.lock();
            return true;
        },

        destroy: function () {
            var self = this;
            this.kill();
            $(document).unbind(self.options.event);
            this.elem.removeData('scrollable');
        }

    };

    $.fn.scrollable = function (params, event) {
        return this.each(function () {
            var that = $(this),
                data = that.data('scrollable'),
                settings = $.extend({}, event, Scrollable.defaults, that.data(), params == typeof 'object' && params);
            data || that.data('scrollable', data = new Scrollable(this, settings));
            typeof params == 'string' && (params = params.split(' '), $.each(params, function (i, param) { data[param]() }));
        });
    };

    $(document).on('scrollable.init', '[data-toggle=scrollable]', function (e) {
        var target = $(this),
            data = target.data('scrollable'),
            action = data ? 'init' : $(this).data();
        e.stopPropagation();
        data ? data.init() : target.scrollable(action, e);
    });

}(jQuery));

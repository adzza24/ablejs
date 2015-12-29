/* Copyright (c) 2015 Adam Anthony
 * Licensed under The MIT License (MIT) - http://opensource.org/licenses/MIT
 * SCROLLABLE - Plugin to make elements on a page respond to scroll events dependent on their position
 * Version 1.1
 * Version 1.2 - Added handling for directional indication classes
 * Version 1.3 - Added an unscrolled option, and created an opposing instance of Scrollable to control the adding/removing of this class
 */
(function ($) {

    var Scrollable = function (elem, settings) {

        this.options = $.extend({}, this.defaults, settings);
        this.options.target || (this.options.target = elem);
        this.options.target = $(this.options.target);
        this.elem = $(elem);
        //this.elem.addClass(this.options.offclassname);
        this.options.edge == "bottom" || (this.options.edge = "top");
        typeof this.options.depth == 'number' || (this.options.depth = 0);
        this.options.event = this.options.type || this.options.event;
        this.elem.trigger('initialised', { target: this.elem });
        this.options.add || this.elem.addClass(this.options.classname);

        if (this.options.oppose) {
            this.antiOptions = $.extend({}, this.options, {
                oppose: false,
                classname: this.options.offclassname,
                depth: this.options.depth + this.elem.outerHeight(true) - this.options.ambiguityafter,
                ambiguity: 0,
                directional: false,
                add: !this.options.add
            });

            this.unscroll = new Scrollable(this.elem[0], this.antiOptions);
        }

        this.init();
    };

    Scrollable.prototype = {

        defaults: {
            classname: 'scrolled',
            offclassname: 'unscrolled',
            add: true,
            edge: "top",
            depth: 0,
            reached: false,
            minwidth: 0,
            width: true,
            scrolled: false,
            unscrolled: true,
            event: 'scroll',
            alive: true,
            contain: true,
            target: false,
            classup: "up",
            classdown: "down",
            lastScroll: 0,
            directional: true,
            directionalambiguity: 50,
            ambiguity: 0,
            ambiguityafter: 0,
            absolute: false,
            direction: "",
            oppose: false
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

            if (this.options.oppose) {
                this.unscroll.init();
            }
        },

        
        setDirection: function (elem) {
            var direction = this.checkScroll(true);
            if (direction && direction != this.options.direction) {
                elem.removeClass(this.options.classup).removeClass(this.options.classdown);
                direction == "up" && elem.addClass(this.options.classup);
                direction == "down" && elem.addClass(this.options.classdown);
                this.options.direction = direction;
            }
        },

        lock: function (elem) {
            elem = elem || this.elem;
            this.options.alive && (this.options.add ? elem.addClass(this.options.classname) : elem.removeClass(this.options.classname));
            //this.elem.removeClass(this.options.offclassname);
            this.options.scrolled = true;
            this.elem.trigger('scrollable.lock');
            //this.options.windowed && this.setUnscrolled(true);
            return true;
        },

        unlock: function (elem) {
            elem = elem || this.elem;
            this.options.alive && (this.options.add ? elem.removeClass(this.options.classname) : elem.addClass(this.options.classname));
            //this.elem.addClass(this.options.offclassname);
            this.options.scrolled = false;
            this.options.unscrolled = true;
            this.updateHeight();
            this.elem.trigger('scrollable.unlock');
            //this.options.windowed && this.setUnscrolled(true);
            return true;
        },

        checkWidth: function () {
            $(window).width() > this.options.minwidth ? this.options.width = true : this.options.width = false;
            this.options.width ? !this.options.alive && this.revive() : this.kill();
        },

        checkScroll: function (direction) {
            var scroll = $(window).scrollTop();
            if (direction) {
                direction = scroll > this.options.lastScroll + this.options.directionalambiguity ? "down" : scroll < this.options.lastScroll - this.options.directionalambiguity ? "up" : false;
                direction && (this.options.lastScroll = scroll);
                return direction;
            }
            scroll > (this.scrolldepth - this.options.ambiguity) ? this.options.reached = true : this.options.reached = false;
            //scroll > (this.scrolldepth) ? this.options.unreached = true : this.options.unreached = false;
        },

        updateHeight: function () {
            !this.options.scrolled &&
            (this._offset = this.offset,
            this.offset = this.elem.offset().top + (this.options.edge == "bottom" ? this.elem.height() : 0),
            this.scrolldepth = this.options.absolute ? this.options.depth : this.offset + this.options.depth,
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
                settings = $.extend({}, event, Scrollable.defaults, that.data(), typeof params == 'object' && params);
            data || that.data('scrollable', data = new Scrollable(this, settings));
            if (typeof params == 'string') $.each(params.split(' '), function (i, param) { data[param]() });
            else data.init();
        });
    };

    $(document).on('scrollable.init', '[data-plugin=scrollable]', function (e) {
        var target = $(this),
            data = target.data('scrollable'),
            action = data ? 'init' : $(this).data();
        e.stopPropagation();
        data ? data.init() : target.scrollable(action, e);
    });

}(jQuery));

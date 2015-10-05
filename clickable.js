/* Copyright (c) 2015 Adam Anthony
 * Licensed under The MIT License (MIT) - http://opensource.org/licenses/MIT
 * CLICKABLE - Plugin to make elements on a page respond to click events, including targeting other elements and running a callback
 * Version 1.2 - amended to work with swipe
 * Version 1.3 - added event binding on init if no event object is passed in
 * Version 1.4 - added an off-class and support for reaping elements from other instances of Clickable
 */

var Clickable = function (el, settings, event, callback) {
    this.elem = $(el);
    settings = settings || {};
    this.config = $.extend({}, this.defaults, settings);
    this.callback = callback || settings.callback || false;
    var self = this;
    typeof (event) == "object" && this.clicker(event) || this.elem.unbind('click.Clickable') && this.elem.on('click.Clickable', function (e) {
        self.elem.clickable({}, self.callback, e);
    });
    this.config.bindtoswipe && this.bindToSwipe();
};
Clickable.prototype = {

    defaults: {
        classname: "clicked",
        offclassname: false,
        target: false,
        bindtoswipe: false,
        reap: false,
        contain: false,
        swipeEscape: ".no-swipe",
        swipeOnEvent: 'swipeleft',
        swipeOffEvent: 'swiperight',
        reapingClass: 'reaping',
        swipeElement: '.touch body',
        callback: false
    },

    bindToSwipe: function () {
        var self = this;

        $(this.config.swipeElement).on(self.config.swipeOnEvent, function (e) {
            var noSwipe = $(e.target).closest(self.config.swipeEscape);
            noSwipe.length == 0 && self.turnOn(e);
        });

        $(this.config.swipeElement).on(self.config.swipeOffEvent, function (e) {
            var noSwipe = $(e.target).closest(self.config.swipeEscape);
            noSwipe.length == 0 && self.turnOff(e);
        });
    },

    clicker: function (event) {
        var self = this;
        if (this.config.contain && typeof (event) == "object" && $(event.target).is(this.elem)) {
            event.preventDefault(), event.stopPropagation();
            return false;
        }
        typeof (event) == "string" && this[event]() || this.controller();
    },

    controller: function () {
        this.config.reap && this.reaper();

        if (this.elem.hasClass(this.config.classname)) {
            this.turnOff();
            this.callback && this.callback(this);
        }
        else {
            this.turnOn();
            this.callback && this.callback(this);
        }
        $('.' + this.config.reapingClass).removeClass(this.config.reapingClass);
    },

    turnOn: function () {
        this.elem.addClass(this.config.classname);
        this.config.target && $(this.config.target).addClass(this.config.classname);
        if (typeof this.config.offclassname == "string") {
            this.elem.removeClass(this.config.offclassname);
            this.config.target && $(this.config.target).removeClass(this.config.offclassname);
        }
        this.status = true;
        this.elem.trigger('clickabled');
    },
    turnOff: function () {
        this.elem.removeClass(this.config.classname);
        this.config.target && $(this.config.target).removeClass(this.config.classname);
        if (typeof this.config.offclassname == "string") {
            this.elem.addClass(this.config.offclassname);
            this.config.target && $(this.config.target).addClass(this.config.offclassname);
        }
        this.status = false;
        this.elem.trigger('unclickabled');
    },

    reaper: function () {
        var self = this;
        var reapees = false;
        var reap = this.config.reap.split(':');
        switch (reap[0]) {
            case "siblings":
                reapees = this.elem.siblings('.' + self.config.classname);
                reapees = reapees.add(reapees.children('.' + self.config.classname));
                break;
            case "parents":
                reapees = this.elem.parent().siblings('.' + self.config.classname);
                reapees = reapees.add(reapees.children('.' + self.config.classname));
                break;
            case "all":
                reapees = $('.' + self.config.classname);
                break;
            case "others":
                $(reap[1]).each(function () {
                    var c = $(this).data('clickable');
                    c && c.elem.removeClass(c.config.classname) && (c.config.target && $(c.config.target).removeClass(c.config.classname));
                });
                break;
            default:
                reapees = $(this.config.reap).filter('.' + self.config.classname);
        }
        if (reapees) {
            reapees.first().parent().addClass(self.config.reapingClass);
            reapees.removeClass(self.config.classname);
        }
    },

    destroy: function () {
        this.turnOff();
        $('.' + this.config.reapingClass).removeClass(this.config.reapingClass);
        $(this.config.swipeElement).unbind(self.config.swipeOnEvent);
        $(this.config.swipeElement).unbind(self.config.swipeOffEvent);
        this.elem.unbind('click.Clickable');
        this.elem.data('clickable', false);
    }
};


$.fn.clickable = function (settings, callback, event) {
    return this.each(function () {

        typeof settings == "function" && (callback = settings) && (settings = {});
        typeof settings == "string" && (event = settings) && (settings = {});
        typeof callback == "string" && (event = callback) && (callback = false);

        var el = $(this),
            c = el.data('clickable'),
            route = 'clicker';
        c ? c.clicker(event) : el.data('clickable', c = new Clickable(this, settings, event, callback));
    });
};

$('[data-plugin="clickable"]').on('click.Clickable', function (event) {
    var el = $(this),
    d = el.data('clickable'),
    e = d ? 'clicker' : el.data();
    typeof e == 'string' ? d[e](event) : el.clickable(e, false, event);
});

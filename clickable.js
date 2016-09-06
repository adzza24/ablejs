/* Copyright (c) 2015 Adam Anthony
 * Licensed under The MIT License (MIT) - http://opensource.org/licenses/MIT
 * CLICKABLE - Plugin to make elements on a page respond to click events, including targeting other elements and running a callback
 * Docs - http://www.adamanthony.co.uk/resources/clickablejs/
 * Version 1.2 - amended to work with swipe
 * Version 1.3 - added event binding on init if no event object is passed in
 * Version 1.4 - added an off-class and support for reaping elements from other instances of Clickable
 * Version 1.5 - added support for multiple classes
 * Version 1.6.0 - made .clickable() look at element data for settings
 * Version 1.6.1 - added a "select" case for reaping, whereby an jQuery selector can be passed in
 * Version 1.6.2 - Made reap:others function without reaping itself
 */

var Clickable = function (el, settings, event, callback) {
    this.elem = $(el);
    settings = settings || {};
    this.config = $.extend({}, this.defaults, settings);
    this.callback = callback || settings.callback || false;
    var self = this;
    typeof (event) != "undefined" && this.clicker(event) || this.elem.unbind('click.Clickable').on('click.Clickable', function (e) {
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
        containtotarget: false,
        containandexit: true,
        containmaxwidth:0,
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
        
        if (this.config.contain && typeof (event) == "object" && $(event.target).is(this.elem) == this.config.containtotarget) {
            if (!this.config.containmaxwidth || ($(window).width() < this.config.containmaxwidth)) {
                event.preventDefault(), event.stopPropagation();
                if (this.config.containandexit) {
                    return false;
                }
            }
        }
        typeof (event) == "string" && this[event]() || this.controller();
    },

    controller: function () {
        this.config.reap && this.reaper();

        if (this.elem.hasClass(this.config.classname)) {
            this.turnOff();
        }
        else {
            this.turnOn();
        }
        this.callback && this.callback(this);
        $('.' + this.config.reapingClass).removeClass(this.config.reapingClass);
    },

    turnOn: function () {
        if (typeof this.config.offclassname == "string") {
            this.elem.removeClass(this.config.offclassname);
            this.config.target && $(this.config.target).removeClass(this.config.offclassname);
        }
        this.config.target && $(this.config.target).addClass(this.config.classname);
        this.elem.addClass(this.config.classname);
        this.status = true;
        this.elem.trigger('clickabled');
        return true;
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
        return true;
    },

    reaper: function () {
        var self = this;
        var reapees = false;
        var reap = this.config.reap.split(':');
        var classes = this.config.classname.split(" ");
        classes = classes.join(".");
        switch (reap[0]) {
            case "siblings":
                reapees = this.elem.siblings('.' + classes);
                reapees = reapees.add(reapees.children('.' + classes));
                break;
            case "parents":
                reapees = this.elem.parent().siblings('.' + classes);
                break;
            case "family":
                reapees = this.elem.parent().siblings('.' + classes);
                reapees = reapees.add(reapees.children('.' + classes));
                break;
            case "select":
                var selectors = reap[1].split(';');
                reapees = this.elem;
                $.each(selectors, function (i, selector) {
                    var arr = selector.trim().split('=');
                    var sel = arr.shift()
                    reapees = reapees[sel](arr.join(' '));
                });
                console.log(reapees);
                break;
            case "all":
                reapees = $('.' + classes);
                break;
            case "others":
                $(reap[1]).each(function () {
                    if (this !== self.elem[0]) {
                        var c = $(this).data('clickable');
                        c && c.turnOff();
                    }
                });
                break;
            default:
                reapees = $(this.config.reap).filter('.' + classes);
        }
        if (reapees) {
            console.log(reapees)
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
            route = c ? 'clicker' : el.data();
        c ? c.clicker(event) : el.data('clickable', c = new Clickable(this, $.extend({}, typeof settings == "object" && settings || {}, route), event, callback));
    });
};

$('[data-plugin="clickable"]').on('click.Clickable', function (event) {
    var el = $(this),
    d = el.data('clickable'),
    e = d ? 'clicker' : el.data();
    typeof e == 'string' ? d[e](event) : el.clickable(e, false, event);
});

/* Copyright (c) 2016 Adam Anthony
 * 
 * DROPPABLE - Plugin to make custom select lists
 * Version 4.2 - fixed keyboard handling, getting the value of the option as well as the inner html
 * Version 4.2.1 - 8/10/2015: fixed blur timer cancellation on mousedown,
 *                 added unbind for window.resize event
 *                 added a check for config.open before killing scrolls to avoid destroying an open list
 *               - 24/03/2016: Added support for pressing the esc key whilst focus in a droplist
 */
var Droppable = function (element, settings, callback) {

    // element is a 'select' list
    this.instance = this.instance + 1 || 1;

    //extend the config
    this.config = $.extend({}, this.defaults, settings);

    //store the base element
    this.elem = $(element);

    //clone the new html elements to avoid conflicts
    this.droplist = this.defaults.droplist.clone();
    this.dropwrap = this.defaults.dropwrap.clone();
    this.droptop = this.defaults.droptop.clone();

    //initialise
    this.init();

};
Droppable.prototype = {

    defaults: {
        droptop: $('<div class="droptop"></div>'),
        droplist: $('<ul class="droplist"></ul>'),
        dropwrap: $('<div class="dropwrap"></div>'),
        dropval: null,
        dropitems: [],
        speed: 100,
        classname: "open",
        selectedclass: 'selected',
        distance: 20,
        event: 'focus',
        animate: true,
        hidefirst: false,
        activeClass: 'dropped',
        currentclass: 'current',
        notThis: null,
        status: true,
        open: false,
        filter: false,
        options: [],
        counter: 0,
        interval: null,
        dependants: false,
        contain: false,
        blurTimer: false,
        scroller: {},
        clickActive: false
    },



    init: function () {
        var self = this;

        if (this.elem.hasClass(this.config.activeClass)) {
            self.elem.trigger('DestroyDrop');
        }

        this.setupDrop();

        if (this.config.status) {
            this.droptop.on('click', function (e) { self.dropClick(e) });

            this.elem.on(this.config.event, function () { self.dropFocus() });

            this.elem.change(function () {
                self.setupList();
            });

            //$(document).on(msd.evt.type.CloseAllDrops, this.closeDrop);

            $(document).on('ReloadDrops', function () { self.setupDrop() });
            this.elem.on('ReloadDrops', function () { self.setupDrop() });
            this.elem.on('DestroyDrop', function () { self.destroy() });
        }
        $(window).resize(function () {
            self.setWidth();
        });

        this.config.contain && this.elem.click(function (e) {
            e.stopPropagation();
        });
    },

    intervalCheck: function (max, duration) {
        var self = this;
        this.intervalClear(self.config.counter);
        this.config.interval = setInterval(function () {
            if (self.config.counter <= max) {
                self.config.counter++;
                self.setupList() && clearInterval(self.config.interval);
            }
            else {
                self.intervalClear();
            }
        }, duration);
    },

    intervalClear: function (counter) {
        clearInterval(this.config.interval);
        this.config.interval = null;
        this.config.counter = counter || 0;
    },

    setupDrop: function () {
        //grab and store this instance of Droppable for nested use
        var self = this;

        //check that this is a valid element
        if (self.elem.is(self.config.notThis)) {
            this.config.status = false;
            this.destroy();
            return;
        }
        var classes = this.elem.attr('class') || false;
        classes && $.each(classes.split(" "), function (i, val) {
            val == self.config.activeClass || val.indexOf('ng-') == -1 && self.dropwrap.addClass(val);
        });

        //check if we have already instantiated
        if (!this.elem.hasClass(self.config.activeClass)) {
            //if not, add the active class so we know next time
            this.elem.addClass(self.config.activeClass);
        }

        this.dropwrap.append(this.droptop);
        this.dropwrap.append(this.droplist);
        this.elem.after(this.dropwrap);

        //setup or wait for angularJS
        this.setupList() || this.intervalCheck(10, 200);

        this.elem.trigger('DropsLoaded');

    },

    setupList: function () {
        var self = this;

        var options = this.elem.children();

        if (options.length == 0 || (this.config.hidefirst && options.length == 1)) {
            return false;
        }

        if (options != this.config.options) {
            clearInterval(this.config.interval);
            //reset the stored drop
            this.config.dropitems.length = 0,
            this.config.options = options,
            this.droplist.empty(),
            this.config.dropval = false;

            //loop through the options and create a new LI for each one
            options.each(function () {
                var value = $(this).html(),
                    item = $('<li class="dropitem"></li>'),
                    val = $(this).prop('value'),
                    textVersion = value.replace(/"/g, "").replace(/</g, "").replace(/>/g, "");

                //store the text value on the item
                item.html(value).data('value', val).attr({'id': textVersion });

                //set the item to selected if it was in the select list
                if ($(this).prop('selected') || $(this).attr('data-selected')) {
                    item.addClass('selected');
                    self.droptop.html(value);

                    //save the value in the config
                    self.config.dropval = val;
                }

                //append the item to the droplist
                self.droplist.append(item);

                self.config.dropitems.push(item);

            });

            //hide the first item if required
            if (this.config.hidefirst) {
                this.droplist.children().first().hide();
                this.config.dropitems.shift();
            }

            //set the selected to the first if it is not already set
            if (!this.config.dropval) {
                var item = this.config.dropitems[0];
                var value = item.data('value'),
                    name = item.html();
                $(options[0]).prop('selected', true).addClass('selected');
                self.config.dropval = value;
                self.droptop.html(name);
            }

            self.setWidth();

            this.elem.trigger('DropsLoaded');
        }
        else {
            return false;
        }
        return true;
    },

    dropFocus: function () {
        var self = this;
        if (!this.dropwrap.hasClass(this.config.classname)) {
            this.initDrop();

            //bind to the blur event to close on tab
            this.elem.one('blur.drop', function () {
                self.config.blurTimer = setTimeout(function () {
                    if (!self.config.clickActive) {
                        self.closeDrop();
                        console.log('blur timeout');
                    }
                }, 500);
            });
        }
    },

    dropClick: function (e) {
        var self = this;
        if (this.dropwrap.hasClass(this.config.classname)) {
            this.closeDrop();
        }
        else {
            this.config.contain && e.stopPropagation();
            self.elem.trigger(self.config.event);
        }

    },

    determineDirection: function () {
        var offset = this.dropwrap.offset().top,
            scroll = $(window).scrollTop(),
            space = $(window).height(),
            height = this.droplist.outerHeight(true) + this.droptop.outerHeight(true) + 20;

        return offset - scroll > space - height ? "above" : "below";
    },

    setWidth: function () {
        var width = this.elem.outerWidth();

        this.dropwrap.css('min-width', width);
    },

    initDrop: function () {
        var self = this;
        this.setupList();
        this.dropwrap.addClass(this.config.classname);

        var direction = this.determineDirection();

        this.dropwrap.addClass(direction);
        direction == "below" && this.droplist.css({ 'margin-top': -this.config.distance + 'px' });
        direction == "above" && this.droplist.css({ 'margin-bottom': -this.config.distance + 'px' });


        //animate
        if (this.config.animate) {
            direction == "below" && this.droplist.animate({ 'margin-top': '0px' }, { queue: false, duration: self.config.speed });
            direction == "above" && this.droplist.animate({ 'margin-bottom': '0px' }, { queue: false, duration: self.config.speed });

        }
        //fade in
        this.droplist.fadeIn(self.config.speed, function () {

            self.config.open = true;

            //initialise custom nicescroll plugin via the this.js handler
            self.initScrolls(self.droplist);
            self.scrollList();

            self.setWidth();

            //pass to limbo event handlers
            self.dropLimbo();
        });
    },

    scrollList: function (el) {

        try {
            var item = typeof (el) != "undefined" ? el : this.droplist.find('.' + this.config.selectedclass),
                offset = (item.offset().top + this.droplist.scrollTop()) - this.droplist.offset().top,
                height = this.droplist.height() / 2;
            if (offset > height || offset <= this.droplist.scrollTop()) {
                this.droplist.scrollTop(offset - height);
            }
        }
        catch (e) {
            //console.log('no element');
        }
    },

    //Temp functions to exist only whilst drop is open
    dropLimbo: function () {
        var self = this;
        $(document).on('keydown.drop', function (e) { self.keyPress(e) });

        $.each(this.config.dropitems, function (index, el) {
            $(el).unbind('mouseenter.drop')
            .on('mouseenter.drop', function () {
                self.droplist.find('.' + self.config.currentclass).removeClass(self.config.currentclass);
                $(this).addClass(self.config.currentclass);
            });
        });

        //bind to the body click
        $('body, html').on('click.drop', function (evt) {
            clearTimeout(self.config.blurTimer);
            self.config.blurTimer = null;

            var that = $(evt.target);

            //check which droplist we are in
            if (!that.closest('.droplist').is(self.droplist)) {

                //close the droplist if its not this one
                self.closeDrop();
            }
            //else if this event target is a direct child of our droplist
            else if (that.parents().is(self.droplist)) {
                evt.stopPropagation();
                //Get the value
                var value = that.data('value');

                //Set the value on the UL and the Select
                self.updateVal(value);

                //close the droplist
                self.closeDrop();

            }
        });
        this.droplist.on('mousedown.drop', function (evt) {
            clearTimeout(self.config.blurTimer);
            self.config.blurTimer = null;
            self.config.clickActive = true;
            $(document).on('mouseup.drop', function () {
                var that = $(evt.target);
                if (that.parents().is(self.droplist)) {
                    evt.stopPropagation();
                    //Get the value
                    var value = that.data('value');

                    //Set the value on the UL and the Select
                    self.updateVal(value);

                    //close the droplist
                    self.closeDrop();
                }
            });
        });
    },

    keyPress: function (key) {

        var current = this.droplist.find('.' + this.config.currentclass);
        current = current.length ? current : this.droplist.find('.' + this.config.selectedclass);
        current = current.length ? current : $(this.config.dropitems[0]);

        if (!current.hasClass(this.config.currentclass)) {
            current.addClass(this.config.currentclass);
        }

        var adjust = this.config.hidefirst ? 1 : 0;
        var i = current.index() - adjust;
        var item = false;

        switch (key.which) {
            case 38: //up

                //prevent the select.change()
                key.preventDefault();

                //get the next item
                var index = i == 0 ? this.config.dropitems.length - 1 : i - 1;
                var item = $(this.config.dropitems[index]);

                break;
            case 40: //down

                //prevent the select.change()
                key.preventDefault();

                //get the next item
                var index = i == this.config.dropitems.length - 1 ? 0 : i + 1;
                var item = $(this.config.dropitems[index]);

                break;
            case 13: //enter
                //prevent the select.change()
                key.preventDefault();
            case 9: //tab

                //Get the value
                var value = current.data('value');

                //Set the value on the UL and the Select
                this.updateVal(value);

            case 27: //esc
                //close the droplist
                this.closeDrop();
                break;
        }

        if (item) {
            item.addClass(this.config.currentclass);
            current.removeClass(this.config.currentclass);
            this.scrollList(item);
        }

    },

    updateVal: function (value) {
        var self = this;

        //if no value supplied
        if (typeof (value) === "undefined") {
            //find the :selected option in the Select list as the default
            value = this.elem.find('option').filter(':selected').prop('value');
        }

        //if its a new value
        if (value !== this.config.dropval) {

            //find the first matching option in the UL
            var selected = this.droplist.children().filter(function () {
                return $(this).data('value') == value;
            }).first();

            //check it exists
            if (selected.length == 1) {

                //Set selected in UL list
                this.droplist.find('.' + this.selectedclass).removeClass(this.selectedclass);
                selected.addClass(this.selectedclass);

                //Update the Select list
                this.elem.children().filter(function () {
                    //filter the options by value
                    return $(this).prop('value') == value;
                }).prop('selected', true);

                //Reset the stored value in the config
                this.config.dropval = value;

                //Setup the drops again via global event
                $(document).trigger('ReloadDrops');

            }
        }

        //always fire the change event, as per a normal select list as well as a custom event containing the value
        self.elem.trigger('DropChange', { value: self.config.dropval });
        self.elem.trigger('change');

        //reset all dependants if they exist
        typeof (this.config.dependants) == "string" && $.each(this.config.dependants.split(","), function (i, dependant) {
            self.resetDependant(dependant);
        });

    },

    //reset a dependant
    resetDependant: function (dependant) {
        //find the instance of Droppable on this dependant
        var drop = $(dependant).data('droppable'),
            value = drop.elem.children().first().prop('value');

        //use this instance of Droppable to force a value update
        drop.updateVal(value);
    },

    //close the droplist
    closeDrop: function () {
        var self = this;

        //clear the blur timeout
        this.config.blurTimer && clearTimeout(this.config.blurTimer),
        this.config.blurTimer = false;

        //animate movement
        if (this.config.animate) {
            this.droplist.animate({ 'margin-top': -this.config.distance + 'px' }, { queue: false, duration: this.config.speed });
        }

        //kill scrolls
        this.killScrolls(this.droplist);

        //fade out
        this.droplist.fadeOut(this.config.speed, function () {

            //remove classes
            self.dropwrap.removeClass(self.config.classname);
            self.dropwrap.removeClass('below');
            self.dropwrap.removeClass('above');
            self.config.clickActive = false;
            self.config.open = false;
        });

        //unbind the close-trigger events
        $('body, html').unbind('click.drop');
        this.elem.unbind('blur.drop');
        this.droplist.unbind('mousedown.drop');
        $(document).unbind('mouseup.drop');
        $(document).unbind('keydown.drop');
        $(window).unbind('resize.drop');

    },

    destroy: function () {
        //unbind all the bindings and remove all classes and objects from the page
        this.closeDrop();
        this.droptop.unbind('click');
        this.elem.unbind('DestroyDrop');

        this.dropwrap.empty().remove();
        this.elem.show().removeClass(this.config.activeClass);
    },

    noAction: function () {
        //nothing to do here
    },


    initScrolls: function (elements, opts) {
        var self = this;
        elements = typeof(elements) == "object" ? elements : $(elements);
        if (elements.length > 0) {

            //kill the scrolls
            this.killScrolls();
            
            opts = opts || {};

            //init the scrolls
            this.config.scroller = {};
            this.config.scroller.scrolls = elements.niceScroll(opts).hide();
            this.config.scroller.data = {};
            this.config.scroller.data.element = elements;
            
            //get the position of the elements - if absolute, then the top position won't work
            var pos = elements.parent().css('position');
            pos == "relative" && pos == elements.css('position');

            //Set to update on a timeout because otherwise chrome gets the wrong positioning
            window.setTimeout(function () {

                //check if the element needs scrollbars
                if (elements[0].offsetHeight < elements[0].scrollHeight) {
                    //find the scrollbars in the document
                    var scrollBars = $('.nicescroll-rails');
                    //if they exist
                    if (typeof (scrollBars.offset()) !== 'undefined' && scrollBars.length > 0) {
                        var top = elements.offset().top;
                        var left = elements.offset().left + elements.outerWidth(true) - $('.nicescroll-rails').width();
                        //if the position is absolute then we have to reset the top to be relative to the parent
                        if (pos === "absolute") {
                            top -= elements.offsetParent().offset().top;
                        }
                        if (pos === "fixed") {
                            top = elements.offsetParent().offset().top;
                            
                            left = elements.offsetParent().offset().left + elements.outerWidth(true);
                        }

                        scrollBars.css({ 'top': top, 'left': left });
                        //console.log(top)
                        scrollBars.fadeIn(100);
                    }
                    else if (typeof (scrollBars.offset) == 'undefined') {
                        console.log('scrollbars are undefined');
                    }
                }
            }, 500);
            $(window).one('resize.drop', function () {
                if (self.config.open) {
                    self.initScrolls(elements);
                }
            });
        }
    },

    killScrolls: function () {

        try {
            if (this.config.scroller.scrolls) {
                this.config.scroller.data.element.removeAttr('style');
                this.config.scroller.scrolls.remove();
                this.config.scroller = {};
            }
        }
        catch (e) { }
    },

};


$.fn.droppable = function (settings, callback) {
    return this.each(function () {
        var elem = $(this),
            data = elem.data('droppable') || (typeof (settings) == 'object' && settings.droppable);
        typeof (settings) == 'string' && typeof (callback) == "undefined" && (callback = settings);
        typeof (callback) == 'string' || (callback = 'noAction');

        data ? data[callback]() : elem.data('droppable', data = new Droppable(this, $.extend({}, typeof (settings) == 'object' && settings, elem.data()), callback));
    });
};



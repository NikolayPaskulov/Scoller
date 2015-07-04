

Element.prototype.addStyles = function (styles) {
    if (!styles || Object.prototype.toString.call(styles).slice(8, -1) != 'Object') throw new Error('Styles accept object');
    for (var style in styles) { this.style[style] = styles[style]; }
}


var Scroller = (function () {
    function Scroller(confing) {
        this.count = confing.numberOfAllElements;           // count of all elements that are scrolled
        this.scrollBy = confing.scrollBy;                   // how many elements are visibile 
        this.heightPerElement = confing.heightPerElement;   // 1 row height
        this.appendConteiner = confing.appendConteiner;     // where scroller to be appended
        this.width = confing.width;                         // scroller width
        this.callback = confing.callback;                   // if some kind of scroll is detected this callback is invoke
        this.startAt = 0;                                   // start point 
        this.endAt = 0 + Number(scrollBy);                  // end point
        this.styles = confing.styles || {};                 // style object that can change scroller styles from outside
        this.disabled = false;                              // is scroller disabled or enabled -> default is enabled
        this.scrollConteiner = confing.scrollConteiner || confing.appendConteiner; // on which conteiner to be scrolled
        this.options = {                                    // options 
            wheelScrollSpeed: 1,                            // default wheelScrollSpeed
            scroller: { mouseover: '#b1b1b1', mouseleave: '#bcbcbc', disabled: '#dddddd' }, // scroller background color states
            scrollHolder: { mousedown: '#e5e5e5', mouseup: '#f1f1f1' },                     // scrollHolder background color states
            buttons: { mouseover: '#d5d5d5', mouseleave: '#f1f1f1', height: 18 }
        }
        this.height = (this.scrollBy * this.heightPerElement) - (this.options.buttons.height * 2);  // scroller Height
    }


    // apend function that create, add styles and append in given conteiner
    Scroller.prototype.append = function () {
        var div = document.createElement('div'),
            self = this;
        div.addStyles({ display: 'inline-block', float: 'left', boxSizing: 'border-box' });

        var button = div.cloneNode(true);

        button.addStyles({ width: '100%', height: this.options.buttons.height + 'px', left: '0', background: this.options.buttons.mouseleave, borderRadius: '2px', color: '#666666', lineHeight: this.options.buttons.height + 'px', cursor: 'pointer', textAlign: 'center' });

        this.html = {
            holder: div.cloneNode(true),
            scrollHolder: div.cloneNode(true),
            scroller: div.cloneNode(true),
            topButton: button.cloneNode(true),
            bottomButton: button.cloneNode(true)
        }

        this.html.holder.addStyles({width: this.width, zIindex: '1', float: 'right', overflow:'hidden' })
        this.html.scrollHolder.addStyles({ width: '100%', background: this.options.scrollHolder.mouseup});
        this.html.scroller.addStyles({ width: '80%', margin: '0 10%', background: this.options.scroller.mouseleave, position: 'relative', borderRadius: '2px', minHeight: '3px', cursor: 'pointer', border: '1px solid #999999' });
        this.html.topButton.addStyles({ top: '0' });
        this.html.bottomButton.addStyles({ bottom: '0' });
        this.html.topButton.innerHTML = '&#x25b2;';
        this.html.bottomButton.innerHTML = '&#x25bc;';
        if (this.styles.scroller) this.html.scroller.addStyles(this.styles.scroller);
        if (this.styles.scrollHolder) this.html.holder.addStyles(this.styles.scrollHolder);

        addEventsToScroller(this);
        addEventsToScrollHolder(this);
        addEventsToScrollButtons(this);
        changeScrollerHeight(this);

        this.html.scrollHolder.appendChild(this.html.scroller);
        this.html.holder.appendChild(this.html.topButton);
        this.html.holder.appendChild(this.html.scrollHolder);
        this.html.holder.appendChild(this.html.bottomButton);
        this.appendConteiner.appendChild(this.html.holder);
        this.changeNumberOfElements(this.count);
        return this;
    }

    // Add all necessary events 
    function addEventsToScroller(self) {

        if (self.scrollConteiner.addEventListener) {                                      // new browsers
            self.scrollConteiner.addEventListener("mousewheel", onMouseWheel, false);     // chrome way
            self.scrollConteiner.addEventListener("DOMMouseScroll", onMouseWheel, false); // mozilla way
        } else {
            self.scrollConteiner.attachEvent("onmousewheel", onMouseWheel);               // old browsers -> IE way
        }

        // When mouse wheel is triggered on given conteiner
        function onMouseWheel(e) {
            if (self.disabled) return;                                    // if scroll is enabled
            if (e.wheelDelta || e.detail) {                               // wheelDelta and detaild in event object are way to detect scroll events
                if (e.wheelDelta > 0 || Number(e.detail) < 0) {           // if scroll is moved up
                    if (self.startAt - self.options.wheelScrollSpeed > 0) moveScrollUp(self, self.options.wheelScrollSpeed);           // and have space to move up by wheelScrollSpeed
                    else moveScrollUp(self, self.startAt);                // else -> move to top
                } else if (e.wheelDelta < 0 || Number(e.detail) > 0) {    // if scroll is moved down
                    if (self.endAt + self.options.wheelScrollSpeed < self.count) moveScrollDown(self, self.options.wheelScrollSpeed);  // and have space to move down by wheelScrollSpeed
                    else moveScrollDown(self, self.count - self.endAt);   // move to bottom
                }
            } else {
                console.log('Your browser doesn\' support MouseWheel Events!') // and totally screwed
            }
            e.preventDefault();
        };

        self.html.scroller.onmouseenter = function () { if (!self.disabled) this.style.background = self.options.scroller.mouseover }   // hover
        self.html.scroller.onmouseout = function () { if (!self.disabled) this.style.background = self.options.scroller.mouseleave }    // hover

        // when scroller is moved manually 
        self.html.scroller.onmousedown = function (e) {          // on drag start
            if (self.disabled) return;                           // if it is enabled
            var primalY = e.pageY,                               // clicked Y position
                primalTop = Number(this.style.top.slice(0, -2)), // scroll offsetTop
                newTop;

            window.onmousemove = function (e) {       // window event 
                var y = e.pageY;                      // current Y position
                newTop = (primalTop + (y - primalY)); // calculate new offsetTop
                if (newTop >= -5 && newTop <= self.height - self.html.scroller.offsetHeight + 15) { // if this new top is in boundaries of conteiner 
                    if (newTop < 0) newTop = 0;       // if top is less then zero then it is zero 
                    if (newTop > self.height - self.html.scroller.offsetHeight) newTop = self.height - self.html.scroller.offsetHeight + 1; // if top is bigger then allowded
                    var pxPerEl = (self.height) / self.count,       // how many pixels is 1 element 
                        elements = Math.ceil((Number(self.html.scroller.style.top.slice(0, -2))) / pxPerEl);  // which elements to show
                    if (elements > (self.count - self.scrollBy)) elements = self.count - self.scrollBy        // check if there are less elements
                    if (elements < 0) elements = 0;                 // if elements are negative make it zero
                    self.startAt = elements;                        // make first element start index
                    self.endAt = self.startAt + self.scrollBy;      // calculate shown elements
                    self.html.scroller.style.top = newTop + 'px';   // change scroller top to a new position
                    self.callback({ startAt: self.startAt, endAt: self.endAt }); // call callback function to change view
                }
                e.preventDefault();
            };

            window.onmouseup = function () { // on mouse up 
                this.onmousemove = null;     // remove mouse move event to prevent unexpected movement
                this.onmouseup = null;       // remove this event
                e.preventDefault();
            };
            e.preventDefault();
            e.stopPropagation();
        };
    }

    function addEventsToScrollHolder(self) {
        self.html.scrollHolder.onmousedown = function () {
            this.style.background = self.options.scrollHolder.mousedown;   // show that u are on scrollHolder
            window.onmouseup = function () { self.html.scrollHolder.style.background = self.options.scrollHolder.mouseup; } // show that u aren't at scrollHolder
        }

        self.html.scroller.onclick = function (e) { e.stopPropagation(); } // stop click on scroller to trigger click on scrollHolder - parent

        self.html.scrollHolder.onclick = function (e) {
            if (document.elementFromPoint(e.clientX, e.clientY) != this || self.disabled) return; // if u where mousedown on scrollHolder but on mouseup u aren't or scroller is disabled
            if (e.offsetY < ((self.html.scroller.getBoundingClientRect().top - window.scrollY) - (self.html.scrollHolder.getBoundingClientRect().top - window.scrollY))) { // if mouse is up of scroller 
                // NO WAY TO DETECT ACTIAL TOP POSITION OF SCROLLER IN SCROLLHOLDER (F that F F F javascript)
                if (self.startAt - self.scrollBy > 0) moveScrollUp(self, self.scrollBy);          // if there is space for full page up
                else moveScrollUp(self, self.startAt);      // scroll to top
            } else { // mouse is down of scroller
                if (self.endAt + self.scrollBy < self.count) moveScrollDown(self, self.scrollBy); // if there is space for full page down
                else moveScrollDown(self, self.count - self.endAt); // scroll to bottom
            }
        }
    }

    function addEventsToScrollButtons(self) {
        self.html.topButton.onmouseenter = function () { this.style.background = self.options.buttons.mouseover; }      // hover
        self.html.topButton.onmouseout = function () { this.style.background = self.options.buttons.mouseleave; }       // hover
        self.html.topButton.onmousedown = buttonMouseHold;

        self.html.bottomButton.onmouseenter = function () { this.style.background = self.options.buttons.mouseover; }   // hover
        self.html.bottomButton.onmouseout = function () { this.style.background = self.options.buttons.mouseleave; }    // hover
        self.html.bottomButton.onmousedown = buttonMouseHold;

        function buttonMouseHold(e) {
            var firstMouseButtonIsClicked = (e.which && e.which == 1) ? true : false, // Detect is first mouse button clicked
                isLooping = false,  // is loop still active -> setInterval
                interval = null,    // holding setInterval method -> needed to clearInterval
                button = this;      // current clickedButton

            if (firstMouseButtonIsClicked) {
                window.onmousemove = function (e) {
                    if (e.target != button) {    // if current mouse target isn't clicked button
                        clearInterval(interval); // stop interval
                        isLooping = false;       // not looping
                    }
                    else if(e.target == button && !isLooping){ // if mouse is back on clicked button
                        interval = setInterval(loop, 50);      // start again 
                        isLooping = true;                      // looping
                    }
                }

                window.onmouseup = function () { // if mouse up after mouse down on button
                    this.onmousemove = null;       // remove mouse move event
                    clearInterval(interval);       // stop interval
                }



                interval = setInterval(loop, 50); // set interval to loop at 50 ms
                isLooping = true;                 // start looping

                function loop() {
                    if (button == self.html.topButton) {
                        if (self.startAt - self.options.wheelScrollSpeed > 0) moveScrollUp(self, self.options.wheelScrollSpeed);          // and have space to move up by wheelScrollSpeed
                        else moveScrollUp(self, self.startAt);                // else -> move to top
                    } else {
                        if (self.endAt + self.options.wheelScrollSpeed < self.count) moveScrollDown(self, self.options.wheelScrollSpeed); // and have space to move down by wheelScrollSpeed
                        else moveScrollDown(self, self.count - self.endAt);   // move to bottom
                    }
                }
            }
        }
    }

    Scroller.prototype.disable = function () { // Disable Scroll
        this.disabled = true;
        this.html.scroller.style.background = this.options.scroller.disabled;
    };

    Scroller.prototype.enable = function () { this.disabled = false; this.html.scroller.style.background = this.options.scroller.mouseleave; } // Enable Scroll

    Scroller.prototype.show = function () { this.html.holder.style.display = ''; }     // Show Scroll

    Scroller.prototype.hide = function () { this.html.holder.style.display = 'none'; } // Hide Scroll

    Scroller.prototype.changeNumberOfElements = function (number) { // dynamically change number of elements -> if there is some kind of filter or any other scenario
        this.count = number;           // all elements are equal to given number
        if (this.endAt > this.count) { // if there whare more elements before
            this.endAt = this.count;
            this.startAt = (this.endAt - this.scrollBy >= 0) ? (this.endAt - this.scrollBy) : 0;
        } else {
            this.endAt = this.startAt + this.scrollBy;
        }
        changeScrollerHeight(this); // make scroller responsive to new number of elements
        changeScrollerTop(this);    // change scroller top
    }

    Scroller.prototype.changeScrollBy = function (number) { // dynamically change number of elements that are shown 
        this.scrollBy = number;
        this.endAt = this.startAt + number;
        this.height = this.heightPerElement * number - (this.options.buttons.height * 2);
        changeScrollerHeight(this);
        changeScrollerTop(this);
    }

    Scroller.prototype.reset = function () { // reset scroller
        this.startAt = 0;
        this.endAt = 0 + this.scrollBy;
        this.html.scroller.style.top = '';
    }

    Scroller.prototype.isScrolledToLastElement = function () {  // when all elements are scrolled
        if (this.endAt >= this.count) return true;
        else return false;
    }

    Scroller.prototype.isScrolledToFirstElement = function () { // when there arent more elements up
        if (this.startAt <= 0) return true;
        else return false;
    }

    Scroller.prototype.scrollDown = function (elements) { moveScrollDown(this, elements || 1); } // move scroller Down

    Scroller.prototype.scrollUp = function (elements) { moveScrollUp(this, elements || 1); }     // move scroller Up

    Scroller.prototype.changeWheelScrollSpeed = function (speed) { if (!isNaN(speed) && speed > 0) this.options.wheelScrollSpeed = Number(speed); }; // change wheelScrollSpeed

    function moveScrollDown(self, number) {
        if (self.endAt < self.count) { // if scroller can move down
            self.startAt += number;    // start position++
            self.endAt += number;      // end position ++
            changeScrollerTop(self);   // change scroller top
            self.callback({ startAt: self.startAt, endAt: self.endAt, direction: 'down' }); // change view
        }
    }

    function moveScrollUp(self, number) {
        if (self.startAt > 0) {      // if scroller can move up
            self.startAt -= number;  // start position--
            self.endAt -= number;    // end position --
            changeScrollerTop(self); // change scroller top
            self.callback({ startAt: self.startAt, endAt: self.endAt, direction: 'up' });  // change view
        }
    }

    function changeScrollerHeight(self) { // change scroller height
        var shownEl = self.scrollBy;                                                         // how many elements are shown on screen
        if (self.count < self.scrollBy) shownEl = self.count;                                // if all elements are less then shown -> shown elements are all elements  
        var scrollByPercent = shownEl / self.count * 100;                                    // what percent of all elements are shown 
        if (isNaN(scrollByPercent) || !isFinite(scrollByPercent)) scrollByPercent = 0;       // if it's NaN or Infinity(divide by zero) make it zero
        self.height = (shownEl * self.heightPerElement) - (self.options.buttons.height * 2); // change height to shown Elements * elementHeight - buttons
        var heightInPX = (self.height / 100) * scrollByPercent;                              // calculate shown elements in px
        self.html.scroller.style.height = heightInPX + 'px';                                 // add that height to scroller to make him responsive to shown elements count
        self.html.scrollHolder.style.height = self.height + 'px';                            // add full height to scrollHolder
        self.html.holder.style.height = (self.height + (self.options.buttons.height * 2)) + 'px';
    }

    function changeScrollerTop(self) {  // change scroller top
        var topPercent = self.startAt / self.count * 100,
            offsetTopInPX = (self.height / 100) * topPercent;

        self.html.scroller.style.top = offsetTopInPX + 'px';
    }

    return Scroller;
})();
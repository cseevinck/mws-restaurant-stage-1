// This code will only be called once all the map segments have been loaded. This is because 
// the dom elements for the site need to be completed before this code can run.

function startComboBox() {
    // (function() {
    'use strict';
    // Define values for keycodes
    const VK_ENTER = 13;
    const VK_ESC = 27;
    const VK_SPACE = 32;
    const VK_LEFT = 37;
    const VK_UP = 38;
    const VK_RIGHT = 39;
    const VK_DOWN = 40;
    var LAST_ID = [];
    var lastIdMod = [];

    /**
     * Generate a unique DOM ID for the combobox selected by the index
     * @param {boxIndex} index for the combobox
     * @return {string}
     */
    function nextId(boxIndex) {
        var id = lastIdMod[boxIndex] + LAST_ID[boxIndex];
        LAST_ID[boxIndex]++;
        return id;
    }

    /**
     * @constructor
     * Implements a minimal combo box: a text field with a list of options which pops up when the text
     * field is focused.
     * Use arrow keys or mouse to choose from available options.
     * @param {boxIndex} index for the combobox
     * @param {Element} el The text field element to decorate.
     * @param {Element} listEl The listbox element to associate with this text field; also decorates
     *     it with the `ListBox` pattern.
     */
    function ComboBox(boxIndex, el, listEl) {
        this.el = el;
        this.listbox = new ListBox(boxIndex, listEl, this);
        listEl.id = nextId(boxIndex);

        // add the aria-owns attribute to the inout element under same parent
        for (let node of listEl.parentNode.childNodes) {
            if (node.nodeName == 'INPUT') {
                node.setAttribute("aria-owns", listEl.id);
                break;
            };
        }
        this.el.addEventListener('focus', this.handleFocus.bind(this), true);
        this.el.addEventListener('blur', this.handleBlur.bind(this), true);
        this.el.addEventListener('input', this.handleInput.bind(this));
        this.el.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    ComboBox.prototype = {
        set value(val) {
            this.el.value = val;
        },

        showListbox: function() {
            this.listbox.show();
            this.el.setAttribute('aria-expanded', true);
        },

        hideListbox: function() {
            this.listbox.hide();
            this.el.setAttribute('aria-expanded', false);
            this.el.removeAttribute('aria-activedescendant');
        },

        handleFocus: function(e) {
            this.showListbox();
        },

        handleBlur: function(e) {
            this.hideListbox();
        },

        handleInput: function(e) {
            this.showListbox();
            this.listbox.filter(this.el.value);
        },

        handleKeyDown: function(e) {
            switch (e.keyCode) {
                case VK_DOWN:
                    if (!this.listbox.hidden) {
                        this.listbox.nextActiveListItem();
                    }
                    break;
                case VK_UP:
                    if (!this.listbox.hidden) {
                        this.listbox.previousActiveListItem();
                    }
                    break;
                case VK_ENTER:
                    var active = this.listbox.activeItem;
                    if (!active)
                        break;
                    this.setSelected(active);
                    this.hideListbox();
                    break;
                case VK_ESC:
                    this.hideListbox();
                    break;
            }

            return;
        },

        setSelected: function(el) {
            this.value = el.textContent;
        },

        /**
         * Sets the aria-activedescendant value of the textbox to the ID of the given element.
         * @param {Element} el
         */
        setActiveDescendant: function(el) {
            if (!el.id)
                return;
            this.el.setAttribute('aria-activedescendant', el.id);
        }
    };

    /**
     * @constructor
     * @param {boxIndex} index for the combobox
     * @param {Element} el The element to decorate as a listbox.
     * @param {Textbox} textbox The textbox which controls this listbox in a combobox pattern.
     */
    function ListBox(boxIndex, el, textbox) {
        this.el = el;
        this.textbox = textbox;
        this.items = Array.prototype.slice.call(el.querySelectorAll('[role=option]'));
        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            item.id = nextId(boxIndex);

            item.addEventListener('mouseover', this.handleHoverOnItem.bind(this));
            item.addEventListener('mousedown', this.handleClickOnItem.bind(this), true);
        }

        this.visibleItems = this.items.slice();
    };


    ListBox.prototype = {
        toggle: function() {
            if (this.hidden) {
                this.show();
            } else {
                this.hide();
            }
        },

        get hidden() {
            return this.el.hasAttribute('hidden');
        },

        get activeItem() {
            return this.el.querySelector('[role=option].active');
        },

        filter: function(str) {
            this.visibleItems = [];
            var foundItems = 0;
            for (var item of this.items) {
                if (item.textContent.toLowerCase().startsWith(str.toLowerCase())) {
                    foundItems++;
                    item.hidden = false;
                    this.visibleItems.push(item);
                } else {
                    item.hidden = true;
                    item.classList.remove('active');
                }
            }
            if (foundItems === 0) {
                this.hide();
            } else {
                for (var i = 0; i < this.visibleItems.length; i++) {
                    var item = this.visibleItems[i];
                    item.setAttribute('aria-posinset', i + 1);
                    item.setAttribute('aria-setsize', this.visibleItems.length);
                }
            }
        },

        show: function() {
            if (!this.hidden)
                return;

            this.el.removeAttribute('hidden');
        },

        hide: function() {
            if (this.hidden)
                return;

            if (this.activeItem)
                this.activeItem.classList.remove('active');
            this.el.setAttribute('hidden', '');
        },

        handleHoverOnItem: function(e) {
            const newIdx = this.visibleItems.indexOf(e.target);
            if (newIdx < 0)
                return;
            this.changeActiveListitem(newIdx);
        },

        handleClickOnItem: function(e) {
            const item = e.target;
            if (this.items.indexOf(item) < 0)
                return;
            this.textbox.setSelected(item);
            this.hide();
        },

        nextActiveListItem: function() {
            var active = this.activeItem;
            var activeIdx = -1;
            if (active)
                activeIdx = this.visibleItems.indexOf(active);

            var newIdx = activeIdx;
            newIdx = (newIdx + 1) % this.visibleItems.length;
            this.changeActiveListitem(newIdx);
        },

        previousActiveListItem: function() {
            var active = this.activeItem;
            var activeIdx = -1;
            if (active)
                activeIdx = this.visibleItems.indexOf(active);

            var newIdx = activeIdx;
            newIdx--;
            if (newIdx < 0)
                newIdx += this.visibleItems.length;

            this.changeActiveListitem(newIdx);
        },

        changeActiveListitem: function(newIdx) {
            var active = this.activeItem;
            var newActive = this.visibleItems[newIdx];
            if (active)
                active.classList.remove('active');
            newActive.classList.add('active');

            this.textbox.setActiveDescendant(newActive);
        }
    };

    var inputs = document.querySelectorAll('input[type=text]');
    var listboxes = document.querySelectorAll('[role=listbox]');

    for (let i = 0; i <= listboxes.length - 1; i++) {
        LAST_ID.push(0);
        lastIdMod.push(':' + (i + 1) + ':'); // different id prefixes for each control
        new ComboBox(i, inputs[i], listboxes[i]);
    }
}
/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';

// @polymerMixin
export const FormMixin = dedupingMixin(superClass =>
    class FormMixin extends superClass {
        open() {
            // Call an open hook function if it is defined. A dialog may use
            // this to do setup or trigger AJAX calls.
            if (this.open_hook) this.open_hook();
            this.$.dialog.open();
        }
        close() { this.$.dialog.close(); }
        // Call this when the dialog content may have changed size, such as
        // when a textarea is modified.
        size_changed() { if (this.$.dialog) this.$.dialog.notifyResize(); }
        resolve_dialog(e) {
            // Call a close hook function if it is defined. A dialog may use this
            // to put temporary values into the object it's editing.
            if (this.before_close_hook) this.before_close_hook();
            this.dispatchEvent(new CustomEvent("closed", {
                bubbles:    true,
                composed:   true,
                detail:     e.detail,
            }));
        }
        // Handle click on the X suffix for a paper-input. This crawls up the DOM
        // until it finds a paper-input and clears it.
        clear_field(e) {
            var elem = e.target;
            while (elem = elem.parentElement)
                if (elem.localName === "paper-input")
                    return elem.value = null;
        }
        // Same, but for a number field.
        clear_number_field(e) {
            var elem = e.target;
            while (elem = elem.parentElement)
                if (elem.localName === "paper-input")
                    return elem.value = 0;
        }
    }
);

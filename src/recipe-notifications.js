/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/* This module listens to toast signals and displays them so that not every
     element needs a paper-toast. */

import '@polymer/paper-toast/paper-toast.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { GestureEventListeners } from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';

import './global-styles.js';

class RecipeNotifications extends GestureEventListeners(PolymerElement) {
    static get template() {
        return html`
<style include="global-styles"></style>
<style>
    :host {
        display: block;
    }
    /* Printing settings. */
    @media print {
        paper-toast {
            display: none;
        }
    }
</style>

<paper-toast id="success_toast" class="success-toast"
            horizontal-align="left" horizontal-offset="20"
            no-cancel-on-esc-key="" duration="4000">
</paper-toast>
<paper-toast id="error_toast" class="error-toast"
            horizontal-align="left" horizontal-offset="20"
            no-cancel-on-esc-key="" duration="4000">
</paper-toast>
`;
    }

    static get is() { return "recipe-notifications"; }
    connectedCallback() {
        super.connectedCallback();
        this._success_listener = this.show_success_toast.bind(this);
        window.addEventListener("success-toast", this._success_listener);
        this._error_listener = this.show_error_toast.bind(this);
        window.addEventListener("error-toast", this._error_listener);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener("success-toast", this._success_listener);
        window.removeEventListener("error-toast", this._error_listener);
    }
    show_success_toast(e) {
        this.$.success_toast.text = e.detail;
        this.$.success_toast.show();
    }
    show_error_toast(e) {
        this.$.error_toast.text = e.detail;
        this.$.error_toast.show();
    }
}
customElements.define(RecipeNotifications.is, RecipeNotifications);

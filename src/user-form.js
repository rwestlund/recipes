/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/* This module displays a user editing form. */

import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { html } from '@polymer/polymer/polymer-element.js';
import { GestureEventListeners } from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';

import '@rwestlund/responsive-dialog/responsive-dialog.js';

import './form-mixin.js';
import './recipes-element.js';
import './global-styles.js';

class UserForm extends GestureEventListeners(
        Recipes.FormMixin(Recipes.Element)) {
    static get template() {
        return html`
<style include="global-styles"></style>
<responsive-dialog id="dialog" title="[[title]]"
        dismiss-text="Cancel" confirm-text="Save"
        on-iron-overlay-closed="resolve_dialog">

    <div class="layout vertical">
        <paper-dropdown-menu label="Account Role"
                vertical-align="top" horizontal-align="right">
            <paper-listbox slot="dropdown-content"
                    attr-for-selected="value" selected="{{user.role}}">
                <template is="dom-repeat" items="[[constants.user_roles]]">
                    <paper-item value="[[item]]">[[item]]</paper-item>
                </template>
            </paper-listbox>
        </paper-dropdown-menu>
    </div>

    <paper-input type="email" label="Email" value="{{user.email}}"
            char-counter="" maxlength="40">
        <paper-icon-button slot="suffix" tabindex="-1" icon="icons:clear"
                on-tap="clear_field">
        </paper-icon-button>
    </paper-input>

</responsive-dialog>
`;
    }

    static get is() { return "user-form"; }
    static get properties() {
        return {
            user: { type: Object },
            title: { type: String, value: "Edit User" },
        }
    }
}
customElements.define(UserForm.is, UserForm);

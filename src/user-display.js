/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/* This module shows a user card. */

import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icons/social-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-spinner/paper-spinner.js';
import '@polymer/paper-styles/element-styles/paper-material-styles.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import { html } from '@polymer/polymer/polymer-element.js';
import { GestureEventListeners } from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';

import './recipes-element.js';
import './global-styles.js';

class UserDisplay extends GestureEventListeners(Recipes.Element) {
    static get template() {
        return html`
<style include="iron-flex iron-flex-alignment"></style>
<style include="paper-material-styles"></style>
<style include="global-styles"></style>
<style>
    :host {
        display: block;
    }
    td.td-label {
        vertical-align: top;
        text-align:     right;
        padding-right:  0.8em;
        width:          6em;
    }
    td.td-field {
        overflow:   hidden;
        word-wrap:  break-word;
    }
</style>

<iron-ajax id="put_ajax"
        method="PUT"
        url="/api/users/[[user.id]]"
        body="[[item_to_edit]]"
        content-type="application/json"
        handle-as="json"
        last-response="{{item_to_edit}}"
        on-response="put_item_successful"
        on-error="put_item_failed"
        loading="{{loading.put_item}}">
</iron-ajax>
<iron-ajax id="delete_item_ajax"
        method="DELETE"
        url="/api/users/[[user.id]]"
        handle-as="json"
        on-error="delete_item_failed"
        on-response="delete_item_successful"
        loading="{{loading.delete_item}}">
</iron-ajax>

<div class="paper-material card-item" elevation="1">
    <!-- Summary header. -->
    <div class="layout horizontal end-justified wrap">
        <h3 class="card-title">[[first_defined(user.name, user.email)]]</h3>
        <span class="flex"></span>
        <span class="card-subtitle">[[user.role]]</span>
    </div>

    <div class="layout horizontal center justified">
        <!-- First column holds the icon. -->
        <iron-icon icon="social:person" class="large-icon"></iron-icon>
        <!-- Second column holds the table with fields. -->
        <table class="fixed-80">
            <tbody><tr>
                <td class="td-label">Email</td>
                <td class="td-field">
                    <a href\$="mailto:[[user.email]]">[[user.email]]</a>
                </td>
            </tr>
            <tr>
                <td class="td-label">Recipes</td>
                <td class="td-field">[[user.recipes_authored]]</td>
            </tr>
            <tr>
                <td class="td-label">Last Seen</td>
                <td class="td-field">[[long_date(user.lastlog)]]</td>
            </tr>
            <tr>
                <td class="td-label">Created</td>
                <td class="td-field">
                    [[long_date(user.creation_date)]]
                </td>
            </tr>
        </tbody></table>

        <span class="flex"></span>
        <!-- Fourth column is just the loading spinner. -->
        <paper-spinner active="[[loading_data]]" alt="loading data...">
        </paper-spinner>

        <!-- Fifth and final column holds edit buttons. -->
        <div class="layout vertical">
            <!-- If we're editing, show edit and delete buttons. -->
            <template is="dom-if" if="[[allowEdit]]">
                <paper-icon-button icon="icons:create" on-tap="edit_item">
                </paper-icon-button>
                <paper-icon-button icon="icons:delete" on-tap="open_delete_item_confirmation">
                </paper-icon-button>
            </template>
        </div>
    </div>
</div>

<paper-dialog id="delete_item_confirmation" on-iron-overlay-closed="delete_item">
    <div>Delete [[user.role]] [[first_defined(user.name, user.email)]]?</div>
    <div class="buttons">
        <paper-button raised="" dialog-dismiss="">Cancel</paper-button>
        <paper-button raised="" dialog-confirm="">Delete</paper-button>
    </div>
</paper-dialog>
`;
    }

    static get is() { return "user-display"; }
    static get properties() {
        return {
            user: { type: Object },
            allowEdit: { type: Boolean, value: false },
            loading: {
                type: Object,
                value: {
                    put_item: false,
                    delete_item: false,
                },
            },
            // True whenever we're loading XHR data.
            loading_data: {
                type: Boolean,
                computed: "compute_loading_data(loading.*)",
            },
        };
    }
    // Loading is true if any flags in it are true.
    compute_loading_data(loading) {
        var ret = false;
        Object.keys(this.loading).forEach( v => ret = ret || this.loading[v] );
        return ret;
    }
    // Opens the edit modal.
    edit_item() {
        // Deep copy the object so we don't change the card's
        // display until the save is successful.
        this.item_to_edit = JSON.parse(JSON.stringify(this.user));
        // Ask for the form to be opened.
        window.dispatchEvent(new CustomEvent("open-form", {
            detail: {
                name:     "edit_user_form",
                user:     this.item_to_edit,
                that:     this,
                callback: "resolve_edit_item_dialog",
            }
        }));
    }
    // Handle response from dialog.
    resolve_edit_item_dialog(e) {
        if (e.detail.confirmed) this.$.put_ajax.generateRequest();
    }
    open_delete_item_confirmation() { this.$.delete_item_confirmation.open(); }
    // Handle result of delete modal.
    delete_item(e) {
        if (e.detail.confirmed) this.$.delete_item_ajax.generateRequest();
    }
    delete_item_successful() {
        window.dispatchEvent(new CustomEvent("success-toast", {
            detail: this.user.role + " " + this.first_defined(
                this.user.name, this.user.email) + " deleted"
        }));
        // Let the parent know that this was deleted.
        this.dispatchEvent(new CustomEvent("item-deleted",
            { bubbles: true, composed: true }));
    }
    delete_item_failed() {
        window.dispatchEvent(new CustomEvent("error-toast", {
            detail: "Failed to delete user :(",
        }));
    }
    // Copy response from PUT to update the display. The rationale
    // for not loading the PUT response directly into user is
    // to prevent a failed return status from clearing the display.
    put_item_successful() {
        this.set('user', this.item_to_edit);
        window.dispatchEvent(new CustomEvent("success-toast", {
            detail: this.user.role + " " + this.first_defined(
                this.user.name, this.user.email) + " saved"
        }));
    }
    put_item_failed() {
        window.dispatchEvent(new CustomEvent("error-toast", {
            detail: "Failed to save user :("
        }));
    }
}
customElements.define(UserDisplay.is, UserDisplay);

/*
    Copyright (c) 2017-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/*
    This module contains all the application's forms. They are triggered
    with signals. This is a workaround for:
    https://github.com/PolymerElements/iron-overlay-behavior/issues/208#issuecomment-234024428
*/
import '@polymer/polymer/lib/elements/dom-if.js';
import { html } from '@polymer/polymer/polymer-element.js';

import './directions-form.js';
import './ingredients-form.js';
import './linked-recipe-form.js';
import './recipe-form.js';
import './recipe-info-form.js';
import { RecipesElement } from './recipes-element.js';
import './user-form.js';

class RecipeForms extends RecipesElement {
    static get template() {
        return html`
<template is="dom-if" if="[[is_user(userRole)]]">
    <recipe-form id="create_recipe_form" title="Create Recipe"></recipe-form>
    <recipe-form id="edit_recipe_form"></recipe-form>
    <ingredients-form id="edit_ingredients_form"></ingredients-form>
    <directions-form id="edit_directions_form"></directions-form>
    <recipe-info-form id="edit_recipe_info_form"></recipe-info-form>
    <linked-recipe-form id="edit_linked_recipe_form"></linked-recipe-form>
</template>

<template is="dom-if" if="[[is_admin(userRole)]]">
    <user-form id="create_user_form" title="Create User"></user-form>
    <user-form id="edit_user_form"></user-form>
</template>
`;
    }

    static get is() { return "recipe-forms"; }
    static get properties() {
        return {
            // Passed in by the parent to conditionally render forms.
            userRole: { type: String },
            // A reference to the element that asked to open a form.
            dialog_parent: { type: Object, value: null },
            // The name of the callback function on the requesting element.
            dialog_callback: { type: String },
        };
    }
    connectedCallback() {
        super.connectedCallback();
        // Listen for requests to open forms.
        this._listener = this.open_form.bind(this);
        window.addEventListener("open-form", this._listener);
        // Every form fires a "closed" event. Rather than binding
        // a listener to each one, let it bubble up and catch them all here.
        this._listener2 = this.dialog_closed.bind(this);
        this.addEventListener("closed", this._listener2);
    }
    // Remove listeners to avoid memory leaks.
    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener("open-form", this._listener);
        this.removeEventListener("closed", this._listener2);
    }
    // On close, notify the element that asked for the form.
    dialog_closed(e) {
        if (this.dialog_parent)
            this.dialog_parent[this.dialog_callback](e);
    }
    // Open whichever form was requested by the signal.
    open_form(e) {
        // Save a reference to the element that sent the request so
        // we can tell it when the form closes.
        this.dialog_parent = e.detail.that;
        // If the sender requests a special callback, use it.
        // Otherwise, use "resolve_dialog".
        this.dialog_callback = e.detail.callback ? e.detail.callback :
            "resolve_dialog";
        // If any of these properties are given from the signal,
        // assign them to the form. This prevents needing a large
        // switch to set up each form.
        var props = [ "recipe", "user" ];
        props.forEach(p => {
            if (e.detail[p])
                this.shadowRoot.querySelector("#" + [e.detail.name])[p]
                    = e.detail[p];
        });
        this.shadowRoot.querySelector("#" + [e.detail.name]).open();
    }
}
customElements.define(RecipeForms.is, RecipeForms);

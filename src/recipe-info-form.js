/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/* This module displays a recipe info editing form. */

import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-input/paper-textarea.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

import '@rwestlund/responsive-dialog/responsive-dialog.js';

import { FormMixin } from './form-mixin.js';

class RecipeInfoForm extends FormMixin(PolymerElement) {
    static get template() {
        return html`
<style include="iron-flex iron-flex-alignment"></style>
<responsive-dialog id="dialog" title="Edit Info"
        dismiss-text="Cancel" confirm-text="Save"
        on-iron-overlay-closed="resolve_dialog">

    <paper-input type="text" label="Amount" value="{{recipe.amount}}"
            char-counter="" maxlength="20">
    </paper-input>
    <paper-input type="text" label="Time" value="{{recipe.time}}"
            char-counter="" maxlength="20">
    </paper-input>
    <paper-input type="text" label="Oven" value="{{recipe.oven}}"
            char-counter="" maxlength="20">
    </paper-input>
    <paper-input type="text" label="Source" value="{{recipe.source}}"
            char-counter="" maxlength="60">
    </paper-input>
    <paper-textarea type="text" label="Notes" value="{{recipe.notes}}"
            autocapitalize="sentences" char-counter="" maxlength="300">
    </paper-textarea>
</responsive-dialog>
`;
    }

    static get is() { return "recipe-info-form"; }
    static get properties() {
        return {
            recipe: { type: Object },
        };
    }
    static get observers() {
        return [ "size_changed(recipe.notes)" ];
    }
}
customElements.define(RecipeInfoForm.is, RecipeInfoForm);

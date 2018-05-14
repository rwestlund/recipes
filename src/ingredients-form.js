/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/* This module displays an ingredients editing form. */

import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { GestureEventListeners } from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';

import '@rwestlund/responsive-dialog/responsive-dialog.js';

import './form-mixin.js';

class IngredientsForm extends GestureEventListeners(
        Recipes.FormMixin(PolymerElement)) {
    static get template() {
        return html`
<style include="iron-flex iron-flex-alignment"></style>
<responsive-dialog id="dialog" title="Edit Ingredients"
        dismiss-text="Cancel" confirm-text="Save"
        on-iron-overlay-closed="resolve_dialog">

    <template is="dom-repeat" items="{{recipe.ingredients}}">
        <paper-input type="text" label="Item [[add_one(index)]]"
                value="{{item}}" char-counter="" maxlength="40">
            <paper-icon-button slot="suffix" tabindex="-1" icon="icons:cancel"
                    on-tap="delete_ingredient">
            </paper-icon-button>
            <paper-icon-button slot="suffix" tabindex="-1"
                    icon="icons:arrow-upward" disabled\$="[[!index]]"
                    on-tap="move_ingredient_up">
            </paper-icon-button>
        </paper-input>
    </template>

    <div class="layout horizontal center-justified">
        <paper-button on-tap="add_ingredient">
            <iron-icon icon="icons:add-circle"></iron-icon>
            Add Item
        </paper-button>
    </div>
</responsive-dialog>
`;
    }

    static get is() { return "ingredients-form"; }
    static get properties() {
        return {
            recipe: { type: Object },
        };
    }
    add_ingredient() {
        this.push("recipe.ingredients", new String());
        this.size_changed();
    }
    delete_ingredient(e) {
        this.splice("recipe.ingredients", e.model.index, 1);
        this.size_changed();
    }
    move_ingredient_up(e) {
        var temp = this.splice("recipe.ingredients", e.model.index, 1)[0];
        this.splice("recipe.ingredients", e.model.index - 1, 0, temp);
    }
    add_one(val) { return val + 1; }
}
customElements.define(IngredientsForm.is, IngredientsForm);

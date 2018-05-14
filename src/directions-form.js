/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/* This module displays a directions editing form. */
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-input/paper-textarea.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { GestureEventListeners } from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

import '@rwestlund/responsive-dialog/responsive-dialog.js';

import './form-mixin.js';

class DirectionsForm extends GestureEventListeners(
        Recipes.FormMixin(PolymerElement)) {
    static get template() {
        return html`
<style include="iron-flex iron-flex-alignment"></style>
<responsive-dialog id="dialog" title="Edit Directions"
        dismiss-text="Cancel" confirm-text="Save"
        on-iron-overlay-closed="resolve_dialog">

    <template is="dom-repeat" items="{{recipe.directions}}">
        <paper-textarea type="text" label="Step [[add_one(index)]]"
                value="{{item}}" autocapitalize="sentences" char-counter=""
                maxlength="200">
        </paper-textarea>
        <div class="layout horizontal end-justified">
            <paper-button on-tap="delete_direction">
                <iron-icon icon="icons:cancel"></iron-icon>
                Remove Step [[add_one(index)]]
            </paper-button>
            <paper-icon-button icon="icons:arrow-upward" disabled\$="[[!index]]"
                    on-tap="move_direction_up">
            </paper-icon-button>
        </div>
    </template>
    <div class="layout horizontal center-justified">
        <paper-button on-tap="add_direction">
            <iron-icon icon="icons:add-circle"></iron-icon>
            Add Step
        </paper-button>
    </div>
</responsive-dialog>
`;
    }

    static get is() { return  "directions-form"; }
    static get properties() {
        return {
            recipe: { type: Object },
        };
    }
    add_direction() {
        this.push("recipe.directions", new String());
        this.size_changed();
    }
    delete_direction(e) {
        this.splice("recipe.directions", e.model.index, 1);
        this.size_changed();
    }
    move_direction_up(e) {
        var temp = this.splice("recipe.directions", e.model.index, 1)[0];
        this.splice("recipe.directions", e.model.index - 1, 0, temp);
    }
    add_one(val) { return val + 1; }
}
customElements.define(DirectionsForm.is, DirectionsForm);

/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/* This module displays a recipe creation form. */
import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
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

import { FormMixin } from './form-mixin.js';
import './global-styles.js';
import { RecipesElement } from './recipes-element.js';

class RecipeForm extends GestureEventListeners(FormMixin(RecipesElement)) {
    static get template() {
        return html`
<style include="iron-flex iron-flex-alignment"></style>
<style include="global-styles"></style>
<responsive-dialog id="dialog" title="[[title]]"
        dismiss-text="Cancel" confirm-text="Save"
        on-iron-overlay-closed="resolve_dialog">

    <paper-input type="text" label="Title" value="{{recipe.title}}"
            autocapitalize="words" char-counter="" maxlength="30">
        <paper-icon-button slot="suffix" tabindex="-1" icon="icons:clear"
                on-tap="clear_field">
        </paper-icon-button>
    </paper-input>

    <paper-input type="text" label="Summary" value="{{recipe.summary}}"
            autocapitalize="sentences" char-counter="" maxlength="50">
        <paper-icon-button slot="suffix" tabindex="-1" icon="icons:clear"
                on-tap="clear_field">
        </paper-icon-button>
    </paper-input>

    <strong class="recipe-item-label">Tags</strong>
    <template is="dom-repeat" items="[[recipe.tags]]">
        <div class="layout horizontal center justified">
            <span>[[item]]</span>
            <paper-icon-button icon="icons:cancel" on-tap="remove_tag">
            </paper-icon-button>
        </div>
    </template>
    <!-- Select a new tag from a drop down. -->
    <div class="layout vertical">
        <paper-dropdown-menu label="Select New Tag"
                vertical-align="bottom" horizontal-align="right">
            <paper-listbox slot="dropdown-content"
                    attr-for-selected="value" selected="{{selected_tag}}">
                <template is="dom-repeat" items="[[tags]]">
                    <paper-item value="[[item]]">[[item]]</paper-item>
                </template>
            </paper-listbox>
        </paper-dropdown-menu>
    </div>
    <!-- Type a new tag from typeahead. -->
    <datalist id="tags">
        <template is="dom-repeat" items="[[tags]]">
            <option value="[[item]]"></option>
        </template>
    </datalist>
    <paper-input type="text" label="Type New Tag" value="{{typed_tag}}"
            list="tags" char-counter="" maxlength="30">
        <paper-icon-button slot="suffix" tabindex="-1" icon="icons:check-circle"
                on-tap="add_typed_tag">
        </paper-icon-button>
    </paper-input>
</responsive-dialog>

<!-- All tags for the add tag typeahead. -->
<iron-ajax id="get_tags"
        method="GET"
        url="/api/tags"
        handle-as="json"
        last-response="{{tags}}"
        on-error="loading_data_failed">
</iron-ajax>
`;
    }

    static get is() { return "recipe-form"; }
    static get properties() {
        return {
            recipe: { type: Object },
            title: { type: String, value: "Edit Recipe" },
            selected_tag: { type: String, observer: "add_selected_tag" },
        };
    }
    open_hook() { this.$.get_tags.generateRequest(); }
    remove_tag(e) {
        this.splice("recipe.tags", e.model.index, 1);
        this.size_changed();
    }
    // Call add_tag with the appropriate variable.
    add_selected_tag(n) {
        if (!n) return;
        this.add_tag(n);
        this.selected_tag = null;
    }
    add_typed_tag() {
        this.add_tag(this.typed_tag);
        this.set("typed_tag", null);
    }
    // Add a tag to the tag list, checking for duplicates first.
    add_tag(tag) {
        for (var i in this.recipe.tags)
            if (this.recipe.tags[i] === tag) return;
        this.push("recipe.tags", tag);
        this.size_changed();
    }
}
customElements.define(RecipeForm.is, RecipeForm);

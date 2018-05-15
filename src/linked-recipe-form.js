/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/* This module displays a linked recipe selection form. */

import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { html } from '@polymer/polymer/polymer-element.js';
import { GestureEventListeners } from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';

import '@rwestlund/responsive-dialog/responsive-dialog.js';

import { FormMixin } from './form-mixin.js';
import './global-styles.js';
import { RecipesElement } from './recipes-element.js';

class LinkedRecipeForm extends GestureEventListeners(FormMixin(RecipesElement)) {
    static get template() {
        return html`
<style include="iron-flex iron-flex-alignment"></style>
<style include="global-styles"></style>
<responsive-dialog id="dialog" title="Edit Linked Recipes"
        dismiss-text="Cancel" confirm-text="Save"
        on-iron-overlay-closed="resolve_dialog">

    <!-- Linked recipe list and typeahead. -->
    <template is="dom-repeat" items="[[recipe.linked_recipes]]">
        <div class="layout horizontal center justified">
            <span>[[item.title]]</span>
            <paper-icon-button icon="icons:cancel"
                    on-tap="remove_linked_recipe">
            </paper-icon-button>
        </div>
    </template>
    <!-- Select a new recipe from a drop down. -->
    <div class="layout vertical">
        <paper-dropdown-menu label="Select New Linked Recipe"
                vertical-align="bottom" horizontal-align="right">
            <paper-listbox slot="dropdown-content" attr-for-selected="value"
                    selected="{{selected_recipe}}">
                <template is="dom-repeat" items="[[recipes]]">
                    <paper-item value="[[item]]">[[item.title]]</paper-item>
                </template>
            </paper-listbox>
        </paper-dropdown-menu>
    </div>
</responsive-dialog>

<!-- All recipes for linked recipe typeahead. -->
<iron-ajax id="get_titles"
        method="GET"
        url="/api/recipes/titles"
        handle-as="json"
        last-response="{{recipes}}"
        on-error="loading_data_failed">
</iron-ajax>
`;
    }

    static get is() { return "linked-recipe-form"; }
    static get properties() {
        return {
            recipe: { type: Object },
            selected_recipe: { type: Object, observer: "add_recipe" },
        };
    }
    open_hook() { this.$.get_titles.generateRequest(); }
    remove_linked_recipe(e) {
        this.splice("recipe.linked_recipes", e.model.index, 1);
        this.size_changed();
    }
    add_recipe(n) {
        if (!n || !n.id) return;
        // Clear the menu. This won't affect n in the current
        // context, and we want to do it no matter when we return.
        this.selected_recipe = null;
        // Don't link to self.
        // TODO this shouldn't be in the list at all
        if (this.recipe.id === n.id) return;
        // Make sure it isn't already there.
        for (var i = 0; i < this.recipe.linked_recipes.length; i++) {
            if (this.recipe.linked_recipes[i].id === n.id)
                return;
        }
        this.push("recipe.linked_recipes", { id: n.id, title: n.title });
        this.size_changed();
    }
}
customElements.define(LinkedRecipeForm.is, LinkedRecipeForm);

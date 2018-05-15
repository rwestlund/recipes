/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/* This module allows editing of a recipe. */

import '@polymer/app-layout/app-grid/app-grid-style.js';
import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-spinner/paper-spinner.js';
import '@polymer/paper-styles/element-styles/paper-material-styles.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { html } from '@polymer/polymer/polymer-element.js';
import { GestureEventListeners } from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';

import './cookie-display.js';
import { RecipesElement } from './recipes-element.js';
import './global-styles.js';

class RecipeDetails extends GestureEventListeners(RecipesElement) {
    static get template() {
        return html`
<style include="iron-flex iron-flex-alignment"></style>
<style include="app-grid-style"></style>
<style include="paper-material-styles"></style>
<style include="global-styles"></style>
<style>
    :host {
        display: block;
    }
    @media (min-width:700px) {
        :host {
            --app-grid-columns: 2;
        }
    }
    paper-button {
        background-color: white;
    }
    h3.recipe-title {
        margin-top: 0;
        margin-bottom: 0;
    }
    div.summary {
        font-style: italic;
        font-size: large;
        text-align: center;
    }
    paper-button {
        margin-bottom: var(--app-grid-gutter);
    }
</style>

<!-- AJAX requests. -->
<iron-ajax
        auto="[[recipeId]]"
        method="GET"
        url="/api/recipes/[[recipeId]]"
        handle-as="json"
        last-response="{{recipe}}"
        on-error="loading_data_failed"
        loading="{{loading.get_item}}">
</iron-ajax>
<iron-ajax id="put_item_ajax"
        method="PUT"
        url="/api/recipes/[[recipeId]]"
        body="[[recipe_to_edit]]"
        content-type="application/json"
        handle-as="json"
        last-response="{{recipe_to_edit}}"
        on-response="put_item_successful"
        on-error="put_item_failed"
        loading="{{loading.put_item}}">
</iron-ajax>
<iron-ajax id="delete_item_ajax"
        method="DELETE"
        url="/api/recipes/[[recipeId]]"
        handle-as="json"
        on-error="delete_item_failed"
        on-response="delete_item_successful"
        loading="{{loading.delete_item}}">
</iron-ajax>

<cookie-display cookie-name="role" cookie-value="{{user_role}}">
</cookie-display>
<cookie-display cookie-name="user_id" cookie-value="{{user_id}}">
</cookie-display>

<div class="headerbar layout horizontal center">
    <a class="inherit-color" href="/">
        <paper-icon-button icon="icons:arrow-back"></paper-icon-button>
    </a>
    <h3 class="recipe-title">[[recipe.title]]</h3>
    <paper-spinner class="nav-button" active="[[loading_data]]"
            alt="loading recipes...">
    </paper-spinner>
    <div class="flex"></div>
    <span class="page-subtitle">[[format_recipe_tags(recipe.tags)]]</span>
</div>
<div class="layout horizontal center">
    <div class="summary flex">[[recipe.summary]]</div>
    <template is="dom-if"
            if="[[allow_recipe_edit(user_role, user_id, recipe.author_id)]]">
        <paper-icon-button icon="icons:create" on-tap="edit_recipe">
        </paper-icon-button>
    </template>
</div>

<div class="app-grid">
    <div class="paper-material card-item" elevation="1">
        <div class="layout horizontal justified">
            <h3 class="card-title">Ingredients</h3>
            <div>
                <template is="dom-if"
                        if="[[allow_recipe_edit(user_role, user_id, recipe.author_id)]]">
                    <paper-icon-button icon="icons:create"
                            on-tap="edit_ingredients">
                    </paper-icon-button>
                </template>
            </div>
        </div>
        <ul class="ingredients-list">
            <template is="dom-repeat" items="[[recipe.ingredients]]">
                <li>[[item]]</li>
            </template>
        </ul>
    </div>

    <div class="paper-material card-item" elevation="1">
        <div class="layout horizontal justified">
            <h3 class="card-title">Directions</h3>
            <div>
                <template is="dom-if"
                        if="[[allow_recipe_edit(user_role, user_id, recipe.author_id)]]">
                    <paper-icon-button icon="icons:create" on-tap="edit_directions">
                    </paper-icon-button>
                </template>
            </div>
        </div>
        <ol class="directions-list">
            <template is="dom-repeat" items="[[recipe.directions]]">
                <li>[[item]]</li>
            </template>
        </ol>
    </div>

    <div class="paper-material card-item" elevation="1">
        <div class="layout horizontal justified">
            <h3 class="card-title">Info</h3>
            <div>
                <template is="dom-if"
                        if="[[allow_recipe_edit(user_role, user_id, recipe.author_id)]]">
                    <paper-icon-button icon="icons:create" on-tap="edit_info">
                    </paper-icon-button>
                </template>
            </div>
        </div>
        <template is="dom-if" if="[[recipe.amount]]">
            <strong class="recipe-item-label">Amount</strong>
            <div>[[recipe.amount]]</div>
        </template>
        <template is="dom-if" if="[[recipe.time]]">
            <strong class="recipe-item-label">Time</strong>
            <div>[[recipe.time]]</div>
        </template>
        <template is="dom-if" if="[[recipe.oven]]">
            <strong class="recipe-item-label">Oven</strong>
            <div>[[recipe.oven]]</div>
        </template>
        <strong class="recipe-item-label">Author</strong>
        <div>[[recipe.author_name]]</div>
        <template is="dom-if" if="[[recipe.source]]">
            <strong class="recipe-item-label">Source</strong>
            <div>[[recipe.source]]</div>
        </template>
        <strong class="recipe-item-label">Revision</strong>
        <div>[[recipe.revision]]</div>
        <template is="dom-if" if="[[recipe.notes]]">
            <strong class="recipe-item-label">Notes</strong>
            <div>[[recipe.notes]]</div>
        </template>
    </div>

    <div class="paper-material card-item" elevation="1">
        <div class="layout horizontal justified">
            <h3 class="card-title">Linked Recipes</h3>
            <div>
                <template is="dom-if"
                        if="[[allow_recipe_edit(user_role, user_id, recipe.author_id)]]">
                    <paper-icon-button icon="icons:create"
                            on-tap="edit_linked">
                    </paper-icon-button>
                </template>
            </div>
        </div>
        <template is="dom-repeat" items="[[recipe.linked_recipes]]">
            <a class="inherit-color" href\$="/recipes/[[item.id]]">
                <paper-button raised="">
                    <iron-icon icon="icons:link"></iron-icon>
                    [[item.title]]
                </paper-button>
            </a>
        </template>
        <template is="dom-if"
                if="[[allow_recipe_edit(user_role, user_id, recipe.author_id)]]">
            <h3>Actions</h3>
            <paper-button raised="" on-tap="open_delete_modal">
                <iron-icon icon="icons:delete"></iron-icon>
                Delete This Recipe
            </paper-button>
        </template>
    </div>
</div>

<paper-dialog id="delete_item_confirmation"
            on-iron-overlay-closed="delete_item">
    <div>Delete [[recipe.title]]?</div>
    <div class="buttons">
        <paper-button raised="" dialog-dismiss="">Cancel</paper-button>
        <paper-button raised="" dialog-confirm="">Delete</paper-button>
    </div>
</paper-dialog>
`;
    }

    static get is() { return "recipe-details"; }
    static properties() {
        return {
            recipeId: { type: String, observer: "recipe_changed" },
            // Holds the recipe we load in.
            recipe: { type: Object },
            loading: {
                type: Object,
                value: {
                    get_item:       false,
                    delete_item:    false,
                    put_item:       false,
                },
            },
            // True whenever we're loading XHR data.
            loading_data: {
                type: Boolean,
                computed: "compute_loading_data(loading.*)",
            },
        };
    }
    // Make app-grid update properly.
    connectedCallback() {
        super.connectedCallback();
        this._listener = this.updateStyles.bind(this);
        window.addEventListener("resize", this._listener);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener("resize", this._listener);
    }
    // Loading is true if any flags in it are true.
    compute_loading_data(loading) {
        var ret = false;
        Object.keys(this.loading)
            .forEach( v => ret = ret || this.loading[v] );
        return ret;
    }
    // Clear these out to prevent showing old data.
    recipe_changed() {
        // TODO this doesn't clear the selected fields.
        this.selected_tag = null;
        this.typed_tag = null;
        this.selected_recipe = null;
    }
    // Users may edit this recipe if they are an Admin,
    // Modererator, or the User who owns it.
    allow_recipe_edit(role, user_id, author_id) {
        return this.is_moderator(role) ||
            (this.is_user(role) && Number(user_id) === author_id);
    }
    edit_recipe() {
        this.recipe_to_edit = JSON.parse(JSON.stringify(this.recipe));
        window.dispatchEvent(new CustomEvent("open-form", {
            detail: {
                name:   "edit_recipe_form",
                recipe: this.recipe_to_edit,
                that:   this,
            }
        }));
    }
    edit_ingredients() {
        this.recipe_to_edit = JSON.parse(JSON.stringify(this.recipe));
        window.dispatchEvent(new CustomEvent("open-form", {
            detail: {
                name:   "edit_ingredients_form",
                recipe: this.recipe_to_edit,
                that:   this,
            }
        }));
    }
    edit_directions() {
        this.recipe_to_edit = JSON.parse(JSON.stringify(this.recipe));
        window.dispatchEvent(new CustomEvent("open-form", {
            detail: {
                name:   "edit_directions_form",
                recipe: this.recipe_to_edit,
                that:   this,
            }
        }));
    }
    edit_info() {
        this.recipe_to_edit = JSON.parse(JSON.stringify(this.recipe));
        window.dispatchEvent(new CustomEvent("open-form", {
            detail: {
                name:   "edit_recipe_info_form",
                recipe: this.recipe_to_edit,
                that:   this,
            }
        }));
    }
    edit_linked() {
        this.recipe_to_edit = JSON.parse(JSON.stringify(this.recipe));
        window.dispatchEvent(new CustomEvent("open-form", {
            detail: {
                name:   "edit_linked_recipe_form",
                recipe: this.recipe_to_edit,
                that:   this,
            }
        }));
    }
    resolve_dialog(e) {
        if (!e.detail.confirmed) return;
        this.$.put_item_ajax.generateRequest();
    }
    open_delete_modal() {
        this.$.delete_item_confirmation.open();
    }
    // Actually do it.
    delete_item(e) {
        if (e.detail.confirmed) this.$.delete_item_ajax.generateRequest();
    }
    put_item_failed() {
        window.dispatchEvent(new CustomEvent("error-toast", {
            detail: "Failed to save recipe :("
        }));
    }
    put_item_successful() {
        // Load the response into recipe_to_edit and copy it here to
        // prevent blanking the screen on a failed request.
        this.set("recipe", this.recipe_to_edit);
        window.dispatchEvent(new CustomEvent("success-toast", {
            detail: this.recipe.title + " saved"
        }));
    }
    delete_item_failed() {
        window.dispatchEvent(new CustomEvent("error-toast", {
            detail: "Failed to delete " + this.recipe.title + " :("
        }));
    }
    // Let the user know, then go back to the list of recipes.
    delete_item_successful() {
        window.dispatchEvent(new CustomEvent("success-toast", {
            detail: this.recipe.title + " deleted"
        }));
        // Let the parent know that it should refresh its list.
        window.dispatchEvent(new CustomEvent("item-collection-refresh", {
            detail: "recipes"
        }));
        // Go back to the list.
        window.history.pushState({}, null, "/");
        window.dispatchEvent(new CustomEvent("location-changed"));
    }
    format_recipe_tags(tags) {
        if (!tags) return "";
        return tags.join(", ");
    }
}
customElements.define(RecipeDetails.is, RecipeDetails);

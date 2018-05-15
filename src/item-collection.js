/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/* This module shows a list of items, with server-side pagination and
     search. */
/* TODO If you expand a recipe, click permalink, then delete it, you'll come
     back to the list with the deleted item still showing. Not sure how to
     reload recipes when that happens. */

import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-fab/paper-fab.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-spinner/paper-spinner.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { html } from '@polymer/polymer/polymer-element.js';
import { GestureEventListeners } from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';

import './global-styles.js';
import './recipe-display.js';
import { RecipesElement } from './recipes-element.js';
import './user-display.js';

class ItemCollection extends GestureEventListeners(RecipesElement) {
    static get template() {
        return html`
<style include="iron-flex iron-flex-alignment"></style>
<style include="global-styles"></style>
<style>
    :host {
        display: block;
    }
    paper-input {
        min-width: 10em;
    }
    paper-button {
        margin-top: 1em;
        background-color: white;
    }
    [hidden] {
        display: none;
    }
</style>

<!-- AJAX requests. -->
<iron-ajax id="get_items_ajax"
        auto=""
        method="GET"
        url="/api/[[itemName]]"
        params="[[search_filter]]"
        handle-as="json"
        last-response="{{items}}"
        debounce-duration="100"
        on-error="loading_data_failed"
        on-response="new_items_received"
        loading="{{loading.get_items}}">
</iron-ajax>
<iron-ajax id="create_item_ajax"
        method="POST"
        url="/api/[[itemName]]"
        body="[[new_item]]"
        content-type="application/json"
        handle-as="json"
        last-response="{{new_item}}"
        on-error="creating_item_failed"
        on-response="creating_item_succeeded"
        loading="{{loading.post_item}}">
</iron-ajax>

<div class="layout horizontal center around-justified wrap">
    <!-- Navigation icons. -->
    <paper-button raised="" on-tap="previous" disabled\$="[[!skip]]">
        <iron-icon icon="icons:arrow-back"></iron-icon>
    </paper-button>
    <paper-button raised="" on-tap="refresh">
        <iron-icon icon="icons:refresh"></iron-icon>
    </paper-button>
    <paper-button raised="" on-tap="next" disabled\$="[[disable_next]]">
        <iron-icon icon="icons:arrow-forward"></iron-icon>
    </paper-button>
    <div>
        <span class="nav-button">Page {{page_number}}</span>
        <paper-spinner class="nav-button" active="[[loading_data]]"
                alt="loading data...">
        </paper-spinner>
    </div>
    <!-- Search box. -->
    <paper-input class="flex" label="Filter" type="text"
            value="{{search_text}}">
        <paper-icon-button slot="suffix" icon="icons:clear" tabindex="-1"
                on-tap="clear_filter">
        </paper-icon-button>
    </paper-input>
</div>

<!-- Display a list of whichever item we're showing. Each type of
     item-collection may include a form for the FAB. -->
<template is="dom-if" if="[[equal(itemName, 'users')]]">
    <template is="dom-repeat" items="[[items]]">
        <user-display allow-edit="" user="{{item}}"></user-display>
    </template>
</template>

<template is="dom-if" if="[[equal(itemName, 'recipes')]]">
    <template is="dom-repeat" items="[[items]]">
        <recipe-display recipe="[[item]]"></recipe-display>
    </template>
</template>

<!-- Show bottom buttons if there are several items listed. -->
<template is="dom-if" if="[[show_bottom_buttons(items)]]">
    <div class="layout horizontal center around-justified wrap">
        <!-- Navigation icons. -->
        <paper-button raised="" on-tap="previous" disabled\$="[[!skip]]">
            <iron-icon icon="icons:arrow-back"></iron-icon>
        </paper-button>
        <paper-button raised="" on-tap="refresh">
            <iron-icon icon="icons:refresh"></iron-icon>
        </paper-button>
        <paper-button raised="" on-tap="next" disabled\$="[[disable_next]]">
            <iron-icon icon="icons:arrow-forward"></iron-icon>
        </paper-button>
        <div>
            <span class="nav-button">Page {{page_number}}</span>
            <paper-spinner class="nav-button" active="[[loading_data]]"
                    alt="loading data...">
            </paper-spinner>
        </div>
    </div>
</template>

<!-- FAB. -->
<paper-fab mini="" icon="icons:add" on-tap="create_item"
        hidden\$="[[!enableFab]]">
</paper-fab>
`;
    }

    static get is() { return "item-collection"; }
    static get properties() {
        return {
            // The parent provides 'recipes' or 'users' here.
            itemName: { type: String },
            // Whether to enable the FAB.
            enableFab: { type: Boolean, value: false },
            items: { type: Array, value: () => [] },
            count: { type: Number, value: 20 },
            skip: { type: Number, value: 0 },
            page_number: { type: Number, computed: "compute_page_number(skip)" },
            search_text: { type: String, value: '' },
            search_filter: {
                type: Object,
                computed: "compute_search_filter(count, skip, search_text)"
            },
            disable_next: {
                type: Boolean,
                computed: "compute_disable_next(items, count)"
            },
            loading: {
                type: Object,
                value: {
                    post_item: false,
                    get_items: false,
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
        Object.keys(this.loading).forEach(k => ret = ret || this.loading[k]);
        return ret;
    }
    compute_search_filter(count, skip, search_text) {
        var o = { count: count };
        if (skip) o.skip = skip;
        if (search_text) o.query = search_text;
        return o;
    }
    compute_disable_next(items, count) {
        var val = true;
        if (this.items)
            val = this.items.length < this.count;
        return val;
    }
    compute_page_number(skip) { return skip + 1; }
    connectedCallback() {
        super.connectedCallback();
        // Recipes have their delete mechanish outside the context
        // of this element. In order to refresh this list when they
        // are deleted, they send this signal.
        this._listener = this.refresh_signal.bind(this);
        window.addEventListener("item-collection-refresh", this._listener);
        // When a child is deleted, refresh the list.
        this._listener2 = this.refresh.bind(this);
        this.addEventListener("item-deleted", this._listener2);
    }
    // Remove listeners to avoid memory leaks.
    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener("item-collection-refresh",
            this._listener);
        this.removeEventListener("item-deleted", this._listener2);
    }
    refresh_signal(e) {
        // Only refresh the one that was changed.
        if (this.itemName == e.detail) this.refresh();
    }
    // Reload the collection of items.
    refresh() { this.$.get_items_ajax.generateRequest(); }
    // Open the appropriate form after a click on the FAB.
    create_item() {
        this.set("new_item", {});
        var data = { that: this, callback: "resolve_create_item" };
        if (this.itemName === "users") {
            data.name = "create_user_form";
            data.user = this.new_item;
        }
        else if (this.itemName === "recipes") {
            this.new_item.tags = [];
            data.name = "create_recipe_form";
            data.recipe = this.new_item;
        }
        // Ask for the form to be opened.
        window.dispatchEvent(new CustomEvent("open-form", { detail: data }));
    }
    // Handle response from dialog.
    resolve_create_item(e) {
        if (e.detail.confirmed) this.$.create_item_ajax.generateRequest();
    }
    creating_item_succeeded() {
        // This isn't in shorter form like the one below because
        // some pages need to change the route.
        if(this.itemName === "users") {
            window.dispatchEvent(new CustomEvent("success-toast", {
                detail: this.new_item.role + " " +
                (this.new_item.name || this.new_item.email) + " created"
            }));
            this.push("items", this.new_item);
        }
        else if (this.itemName === "recipes") {
            window.history.pushState({}, null, "/recipes/"+this.new_item.id+"/");
            window.dispatchEvent(new CustomEvent("location-changed"));

            window.dispatchEvent(new CustomEvent("success-toast", {
                detail: this.new_item.title + " created"
            }));
        }
    }
    creating_item_failed() {
        var data;
        if (this.itemName === "users") data = "Failed to create user :(";
        else if(this.itemName === "recipes") data = "Failed to create recipe :("

        window.dispatchEvent(new CustomEvent("error-toast", { detail: data }));
    }
    previous() { if (this.skip) this.skip--; }
    next() { this.skip++; }
    clear_filter() { this.search_text = ""; }
    // Only show bottom nav buttons if there are several items.
    show_bottom_buttons(items) {
        if (!items) return false;
        return items.length > 5;
    }
    // When new items are received, back up a page if the
    // current one is blank.
    new_items_received() {
        if (this.items && !this.items.length && this.skip) this.skip--;
    }
}
customElements.define(ItemCollection.is, ItemCollection);

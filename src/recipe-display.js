/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/* This module shows a recipe card. */

import '@polymer/app-layout/app-grid/app-grid-style.js';
import '@polymer/iron-collapse/iron-collapse.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-styles/element-styles/paper-material-styles.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { html } from '@polymer/polymer/polymer-element.js';
import { GestureEventListeners } from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';

import './recipes-element.js';
import './global-styles.js';

class RecipeDisplay extends GestureEventListeners(Recipes.Element) {
    static get template() {
        return html`
<style include="iron-flex iron-flex-alignment"></style>
<style include="paper-material-styles"></style>
<style include="app-grid-style"></style>
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
    @media (min-width:1000px) {
        :host {
            --app-grid-columns: 3;
        }
    }
</style>

<div class="paper-material card-item" elevation="1" on-tap="expand_recipe">
    <div class="layout horizontal end end-justified wrap">
        <h3 class="card-title">[[recipe.title]]</h3>
        <span class="flex"></span>
        <span class="card-subtitle">[[fmt_tags(recipe.tags)]]</span>
    </div>
    <div>[[recipe.summary]]</div>

    <iron-collapse id="collapse" opened="{{recipe._expanded}}">
        <div class="app-grid">
            <div>
                <strong class="recipe-item-label">Ingredients</strong>
                <ul class="ingredients-list">
                    <template is="dom-repeat" items="[[recipe.ingredients]]">
                        <li>[[item]]</li>
                    </template>
                </ul>
            </div>
            <div>
                <strong class="recipe-item-label">Directions</strong>
                <ol class="directions-list">
                    <template is="dom-repeat" items="[[recipe.directions]]">
                        <li>[[item]]</li>
                    </template>
                </ol>
            </div>
            <!-- Info column. -->
            <div>
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
                <template is="dom-if" if="[[recipe.linked_recipes.length]]">
                    <strong class="recipe-item-label">Linked Recipes</strong>
                    <template is="dom-repeat" items="[[recipe.linked_recipes]]">
                        <a class="inherit-color" href\$="/recipes/[[item.id]]/"
                                on-tap="stop_propagation">
                            <paper-button raised="">
                                <iron-icon icon="icons:link"></iron-icon>
                                [[item.title]]
                            </paper-button>
                        </a>
                    </template>
                </template>
                <!-- Edit recipe button. -->
                <div class="layout horizontal end-justified">
                    <a class="inherit-color" href\$="/recipes/[[recipe.id]]/"
                            on-tap="stop_propagation">
                        <paper-button raised="">
                            <iron-icon icon="icons:description"></iron-icon>
                            Permalink
                        </paper-button>
                    </a>
                </div>
            </div>
        </div>
    </iron-collapse>
</div>
`;
    }

    static get is() { return "recipe-display"; }
    static get properties() {
        return {
            recipe: { type: Object },
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
    expand_recipe(event) {
        this.set('recipe._expanded', !this.recipe._expanded);
    }
    fmt_tags(tags) { return tags.join(", "); }
}
customElements.define(RecipeDisplay.is, RecipeDisplay);

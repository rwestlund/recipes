/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/* This is the main application. */
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-grid/app-grid-style.js';
import '@polymer/app-layout/app-header-layout/app-header-layout.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-scroll-effects/effects/waterfall.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/iron-icons/maps-icons.js';
import '@polymer/iron-icons/social-icons.js';
import '@polymer/neon-animation/neon-animatable.js';
import '@polymer/neon-animation/neon-animated-pages.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-styles/element-styles/paper-material-styles.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import { html } from '@polymer/polymer/polymer-element.js';
import { GestureEventListeners } from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';
import { scroll } from '@polymer/app-layout/helpers/helpers.js';

import './cookie-display.js';
import './global-styles.js';
import './item-collection.js';
import './recipe-details.js';
import './recipe-forms.js';
import './recipe-notifications.js';
import './recipes-element.js';

class RecipesApp extends GestureEventListeners(Recipes.Element) {
    static get template() {
    return html`
<style include="iron-flex iron-flex-alignment"></style>
<style include="app-grid-style"></style>
<style include="paper-material-styles"></style>
<style include="global-styles"></style>
<style>
    :host {
        --dark-primary-color: #303F9F;
        --default-primary-color: #3F51B5;
        --light-primary-color: #C5CAE9;
        --text-primary-color: #ffffff; /*text/icons*/
        --accent-color: #FF4081;
        /* Also defined in index.html. */
        --primary-background-color: #e9e9ef;
        --dark-background-color: #d9d9df;
        --primary-text-color: #212121;
        --secondary-text-color: #727272;
        --disabled-text-color: #bdbdbd;
        --divider-color: #B6B6B6;

        /* paper-fab */
        --paper-fab-background: var(--default-primary-color);

        --app-drawer-width: 10em;
        --app-drawer-content-container: {
            border-right: 1px solid var(--dark-primary-color);
            background-color: var(--primary-background-color);
        }
        --responsive-dialog-paper-dialog: {
            width: 500px;
        }
        --responsive-dialog-toolbar: {
            background-color: var(--dark-primary-color);
            color: #dedede;
        }
        --app-grid-gutter: 5px;
    }
    @media (min-width:700px) {
        :host {
            --app-grid-columns: 2;
        }
    }
    div[main-title] {
        font-size: x-large;
        font-weight: bold;
    }
    div.main-content {
        padding: 0 10px;
    }
    app-toolbar {
        color: #DEDEDE;
        background-color: var(--dark-primary-color);
        font-size: medium;
    }
    paper-listbox a {
        text-decoration: none;
        color: #111111;
    }
    paper-listbox .iron-selected paper-item {
        color: var(--dark-primary-color);
        background-color: var(--dark-background-color);
        font-weight: bold;
    }
    iron-icon {
        margin-right: 5px;
    }
    /* Hide the drawer menu on wide layout. */
    app-drawer-layout:not([narrow]) [drawer-toggle] {
          display: none;
    }
</style>

<app-drawer-layout id="drawer_layout" fullbleed responsive-width="900px">
    <app-drawer id="drawer" slot="drawer" swipe-open>
        <app-toolbar></app-toolbar>
        <paper-listbox selected="[[route_data.page]]"
                attr-for-selected="name"
                on-tap="drawer_toggle">
            <!-- Note: because of how app-route matches, all routes must
                 end with a slash. -->
            <a name="" href="/">
                <paper-item>
                    <iron-icon icon="icons:list"></iron-icon>
                    <span>Recipes</span>
                </paper-item>
            </a>
            <a name="about" href="/about/">
                <paper-item>
                    <iron-icon icon="icons:info"></iron-icon>
                    <span>About</span>
                </paper-item>
            </a>
            <a name="users" href="/users/" hidden$="[[!is_admin(user_role)]]">
                <paper-item>
                    <iron-icon icon="social:people"></iron-icon>
                    <span>Users</span>
                </paper-item>
            </a>
            <hr>
            <template is="dom-if" if="[[!user_name]]">
                <a href="/api/auth/google/login">
                    <paper-item>
                        <iron-icon icon="icons:exit-to-app"></iron-icon>
                        <span>Sign in with Google</span>
                    </paper-item>
                </a>
            </template>
            <template is="dom-if" if="[[user_name]]">
                <a href="/api/auth/logout">
                    <paper-item>
                        <iron-icon icon="maps:directions-run"></iron-icon>
                        <span>Logout</span>
                    </paper-item>
                </a>
            </template>
        </paper-listbox>
    </app-drawer>

    <app-header-layout fullbleed>
        <app-header slot="header" fixed effects="waterfall">
            <app-toolbar>
                <paper-icon-button icon="icons:menu" drawer-toggle>
                </paper-icon-button>
                <div main-title>Recipes</div>
                <span class="user-name">
                    <iron-icon icon="icons:account-circle"></iron-icon>
                    <template is="dom-if" if="[[!user_name]]">
                        <span>Not signed in</span>
                    </template>
                    <template is="dom-if" if="[[user_name]]">
                        <span>[[user_name]]</span>
                    </template>
                </span>
            </app-toolbar>
        </app-header>

        <div class="main-content">
            <neon-animated-pages
                    entry-animation="fade-in-animation"
                    exit-animation="fade-out-animation"
                    selected="[[route_data.page]]"
                    attr-for-selected="name"
                    fallback-selection="404">

                <neon-animatable name="">
                    <item-collection item-name="recipes"
                            enable-fab="[[is_user(user_role)]]">
                    </item-collection>
                </neon-animatable>

                <neon-animatable name="recipes">
                    <recipe-details recipe-id="[[recipes_route_data.id]]">
                    </recipe-details>
                </neon-animatable>

                <neon-animatable name="about">
                    <br >
                    <div class="paper-material card-item" elevation="1">
                        <h3 class="card-title">About</h3>
                        <div class="app-grid">
                            <div>
                                <p>
                                    Welcome to our recipe database! This
                                    started as a project just for my wife
                                    and I, because we got tired of keeping
                                    track of a bunch of links to other
                                    websites with ads, inconsistent
                                    formatting, changing links, etc.
                                </p>
                                <p>
                                    We decided to improve it and open it to
                                    others.  Anyone can access information
                                    here, and family and friends will have
                                    the ability to log in and add recipes.
                                </p>
                            </div>
                            <div>
                                <p>
                                    If you don't have an account and would
                                    like to add recipes, I'll add you if
                                    one of my friends will vouch for you.
                                    If you have any technical issues or
                                    suggestions, contact me at
                                    rwestlun@gmail.com.
                                </p>
                                <p>
                                    The source for this site is on
                                    <a href="https://github.com/rwestlund/recipes">
                                        GitHub</a>
                                    under the BSD-2-Clause license.
                                </p>
                                <div>Randy Westlund</div>
                                <div><a href="https://www.textplain.net">
                                    www.textplain.net</a>
                                </div>
                            </div>
                        </div>
                        <br>
                        <br>
                        <div>Version 2.0.1</div>
                        <div>Released 2016-07-13</div>
                    </div>
                </neon-animatable>

                <template is="dom-if" if="[[is_admin(user_role)]]">
                    <neon-animatable name="users">
                        <item-collection item-name="users" enable-fab>
                        </item-collection>
                    </neon-animatable>
                </template>
                
                <neon-animatable name="404">
                    <p>404, this page doesn't exist.</p>
                </neon-animatable>

            </neon-animated-pages>
        </div>

    </app-header-layout>
</app-drawer-layout>

<!-- Invisible stuff below here. -->
<cookie-display cookie-name="username" cookie-value="{{user_name}}">
</cookie-display>
<cookie-display cookie-name="role" cookie-value="{{user_role}}">
</cookie-display>

<!-- Ignore /api/ and /s/ routes; they need to go to the server. -->
<app-location
        route="{{route}}"
        url-space-regex="^/(?!(api|s)/)">
</app-location>

<app-route
        route="{{route}}"
        pattern="/:page"
        data="{{route_data}}">
</app-route>
<!-- If every page used the same subrouter, they'd all be bound to the same
     id (i.e. loading /recipes/2 would also try to load /users/2). Instead,
     use a separate subrouter for each path so that a non-active path will
     not match the id from the current path. There may be a better way to
     do this. -->
<app-route
        route="{{route}}"
        pattern="/recipes/:id"
        data="{{recipes_route_data}}">
</app-route>

<!-- All the application's forms are contained in here and triggered with
     signals. This is a workaround for:
     https://github.com/PolymerElements/iron-overlay-behavior/issues/208#issuecomment-234024428
-->
<recipe-forms user-role="[[user_role]]"></recipe-forms>

<!-- This displays toast events. -->
<recipe-notifications></recipe-notifications>
`;
    }

    static get is() { return "recipes-app"; }
    static get properties() {
        return {
            route_data: { type: Object, observer: "page_changed" },
            // This holds the saved scroll position for each main page.
            scrollpos_map: { type: Object, value: () => ({}) },
            // Using this delays setting the page long enough to save the
            // old position.
            current_page: { type: String, value: "" },
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
    drawer_toggle() {
        if (this.$.drawer_layout.narrow) this.$.drawer.toggle();
    }
    // Preserve the scroll position on each page, like
    // app-scrollpos-control used to.
    page_changed(new_data, old_data) {
        // Save the old position.
        if (old_data != null && old_data.page != null) {
            this.scrollpos_map[old_data.page] = window.pageYOffset;
        }
        // Go to the new page.
        this.current_page = new_data.page;
        // Return to previous position on this page, if any.
        if (this.scrollpos_map[new_data.page] != null) {
            scroll({
                top:        this.scrollpos_map[new_data.page],
                behavior:   "silent"
            });
        }
        // Otherwise, just go to the top.
        else if (this.isAttached) {
            scroll({ top: 0, behavior: "silent" });
        }
    }
}
customElements.define(RecipesApp.is, RecipesApp);

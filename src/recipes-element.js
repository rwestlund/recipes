import { PolymerElement } from '@polymer/polymer/polymer-element.js';
let constants = {};

constants.user_role_enum = {
    admin:      'Admin',
    moderator:  'Moderator',
    user:       'User',
    guest:      'Guest',
};

// Take an dictionary, return an array of values. This is defined outside the
// mixin so I can use it on constants.
var to_array = function(obj) {
    if (!obj) return [];
    return Object.keys(obj).map(k => obj[k]).sort();
};

// Provide presorted lists.
constants.user_roles = to_array(constants.user_role_enum);

// Finally, the actual element begins.
export const RecipesElement = class RecipesElement extends PolymerElement {
    static get is() { return "recipes-element"; }
    static get properties() {
        return {
            constants: { type: Object, value: constants },
        };
    }
    is_admin(role) {
        return role === this.constants.user_role_enum.admin;
    }
    is_moderator(role) {
        return role === this.constants.user_role_enum.admin
            || role === this.constants.user_role_enum.moderator;
    }
    is_user(role) {
        return role === this.constants.user_role_enum.admin
            || role === this.constants.user_role_enum.moderator
            || role === this.constants.user_role_enum.user;
    }
    // A generic AJAX error handler.
    loading_data_failed() {
        window.dispatchEvent(new CustomEvent("error-toast", {
            detail: "Failed to communicate with server :("
        }));
    }
    stop_propagation(e) { e.stopPropagation(); }
    long_date(d) {
        if (!d) return "";
        var date = new Date(d);
        return date.toDateString() + ' ' + date.toLocaleTimeString();
    }
    equal(a, b) { return a === b; }
    first_defined(a, b) { return a || b; }
}
customElements.define(RecipesElement.is, RecipesElement);

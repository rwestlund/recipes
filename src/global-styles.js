/*
    Copyright (c) 2016-2018, Randy Westlund. All rights reserved.
    This code is under the BSD-2-Clause license.
*/
/* This defines CSS that is imported by every element. */

const $_documentContainer = document.createElement('div');
$_documentContainer.setAttribute('style', 'display: none;');

$_documentContainer.innerHTML = `<dom-module id="global-styles">
    <template>
        <style>
            * {
                -webkit-box-sizing: border-box;
                   -moz-box-sizing: border-box;
                        box-sizing: border-box;

                font-family: 'Open Sans', sans-serif;
            }
            iron-icon.large-icon {
                --iron-icon-width:      4em;
                --iron-icon-height:     4em;
                --iron-icon-fill-color: gray;
            }
            a.inherit-color {
                color:              inherit;
                text-decoration:    none;
            }
            recipe-display, user-display {
                margin-bottom: var(--app-grid-gutter);
            }
            paper-fab {
                position:   fixed;
                bottom:     1em;
                right:      2em;
                z-index:    100;
            }
            div.paper-material.card-item {
                background-color:   white;
                border-radius:      3px;
                padding-left:       0.5em;
                padding-right:      0.5em;
                padding-top:        0.5em;
                padding-bottom:     0.5em;
            }
            .card-title {
                margin-top:     0;
                margin-bottom:  0;
            }
            .card-subtitle {
                color:      gray;
                text-align: right;
            }
            .item-col {
                 margin-left:   0.4em;
                 margin-right:  0.4em;
                 margin-bottom: 0.2em;
                 min-width:     20em;
            }
            ul.ingredients-list > li {
                margin-bottom: 0.3em;
            }
            ol.directions-list > li {
                margin-bottom: 1em;
            }
            .nav-button {
                margin-left: 0.8em;
                margin-right: 0.8em;
            }
            div.headerbar > paper-button {
                margin-top: 1.2em;
                margin-bottom: 1.2em;
            }
            .recipe-item-label {
                padding-top: 1em;
                display: block;
            }

            paper-toast.success-toast {
                --paper-toast-background-color: green;
                --paper-toast-color: white;
            }
            paper-toast.warn-toast {
                --paper-toast-background-color: orange;
                --paper-toast-color: white;
            }
            paper-toast.error-toast {
                --paper-toast-background-color: red;
                --paper-toast-color: white;
            }
        </style>
    </template>
</dom-module>`;

document.head.appendChild($_documentContainer);

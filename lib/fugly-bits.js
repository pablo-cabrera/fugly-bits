(function () {
    "use strict";

    /**
     * Returns the first element node from its child list.
     *
     * @method getFirstChildElement
     * @for fugly.bits.FuglyBits
     *
     * @param {HTMLElement}
     *
     * @return {HTMLElement}
     */
    var getFirstChildElement = function (n) {
        n = n.firstChild;
        do {
            if (n.nodeType === Node.ELEMENT_NODE) {
                return n;
            }

            n = n.nextSibling;
        } while (n !== null);

        return null;
    };

    /**
     * Responsible for fetching and caching resources.
     *
     * @constructor
     * @class fugly.bits.Resources
     *
     * @param {function} xhrFactory Factory function that yields a new
     *                     XMLHttpRequest
     */
    var Resources = function (xhrFactory) {
        this.xhr = xhrFactory;
        this.resources = {};
    };

    /**
     * Returns the resource contents.
     *
     * @method getResource
     * @for fugly.bits.Resources
     *
     * @param {string} resource
     *
     * @return {string}
     */
    Resources.prototype.getResource = function (resource) {
        if (!(resource in this.resources)) {
            this.resources[resource] = this.fetchResource(resource);
        }
        return this.resources[resource];
    };

    /**
     * Fetches a given resource from the network.
     *
     * @method fetchResource
     * @for fugly.bits.Resources
     *
     * @param {string} resource
     *
     * @return {string}
     */
    Resources.prototype.fetchResource = function (resource) {
        var xhr = this.xhr();
        xhr.open("GET", resource, false);
        xhr.send(null);
        return xhr.responseText;
    };

    /**
     * Loads the resources cache with preloaded resources using an object as a
     * string/string dictionary.
     *
     * @method preload
     * @for fugly.bits.Resources
     *
     * @param {object} resouces Resources dictionary
     */
    Resources.prototype.preload = function (resources) {
        for (var r in resources) {
            if (resources.hasOwnProperty(r)) {
                this.resources[r] = resources[r];
            }
        }
    };

    /**
     * Reprensents a component using a fugly template fetched from a network
     * resource.
     *
     * @class fugly.bits.FuglyBit
     * @constructor
     *
     * @param {HTMLDocument} ownerDocument
     * @param {fugly.bits.Resources} resources
     * @param {string} src
     */
    var FuglyBit = function (ownerDocument, resources, src) {
        var contents =
            "<$ var bits = view.bits; view = view.view;\n $>" +
            resources.getResource(src);


        var template = new fugly.Template(contents);

        var view;
        var root = null;

        /**
         * Renders the fugly-bit within the given html element (appended)
         * Another parameter may be passed as view, otherwise it will use the
         * view from the previous render call.
         *
         * @method render
         * @for fugly.bits.FuglyBit
         *
         * @param {HTMLElement} context
         * @param {mixed} [view]
         */
        this.render = function (context, v) {
            var bits, tmp;

            if (arguments.length === 2) {
                view = v;
            }

            this.remove();

            tmp = ownerDocument.createElement("div");
            tmp.innerHTML = template.render({
                bits: function (fn) { bits = fn; },
                view: view
            });

            root = getFirstChildElement(tmp);
            tmp.removeChild(root);
            tmp = null;

            context.appendChild(root);

            if (typeof bits !== "function") {
                bits = new Function("root", "view",
                       resources.getResource(src + ".bits"));
            }

            this.api = bits(root, view) || {};
        };

        /**
         * Removes a previously rendered componente from its parent and ditches
         * its existing api.
         *
         * @method remove
         * @for fugly.bits.FuglyBit
         */
        this.remove = function () {
            delete this.api;

            if (root !== null && root.parentNode !== null) {
                root.parentNode.removeChild(root);
                root = null;
            }
        };
    };

    var resources = new Resources(function () { return new XMLHttpRequest(); });

    /**
     * Static method to create fugly-bits
     *
     * @method bits
     * @for fugly-js::fugly
     * @static
     *
     * @param {string} src
     *
     * @return fugly.bits.FuglyBit
     */
    fugly.bits = function (src) {
        return new FuglyBit(document, resources, src);
    };

    /**
     * Static method to preload its static resources
     *
     * @method preload
     * @for fugly-bits::fugly.bits
     *
     * @param {object} stuff
     */
    fugly.bits.preload = function (stuff) {
        resources.preload(stuff);
    };

    fugly.bits.Resources = Resources;
    fugly.bits.FuglyBit = FuglyBit;
}());

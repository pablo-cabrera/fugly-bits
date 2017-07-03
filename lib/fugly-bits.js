(function () {
    "use strict";

    var uniqueId = (function () {
        var
            chars = "abcdefghijklmnopqrstwxyzABCDEFGHIJKLMNOPQRSTWXYZ",
            length = chars.length,
            lastChar = chars.charAt(chars.length - 1),
            firstChar = chars.charAt(0),
            id = [],
            suffix = [];

        while (suffix.length < 32) {
            suffix.push(chars.charAt(Math.floor(Math.random() * length)));
        }
        suffix = suffix.join("");

        return function () {
            var i, c;
            for (i = id.length - 1; i > -1; i -= 1) {
                c = id[i];
                if (c !== lastChar) {
                    id[i] = chars.charAt(chars.indexOf(c) + 1);
                    break;
                }

                id[i] = firstChar;
            }

            if (i === -1) {
                id.unshift(firstChar);
            }

            return "fugly.bits-inline-" + id.join("") + suffix;
        };
    }());

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
     * @param {fugly.bits.Resources} resources
     * @param {string} source
     */
    var FuglyBit = ilk.tokens(function (
        template,
        root,
        resources,
        source,
        callback,
        inlineBits,

        inline,
        populateBits,
        finalizeBits,
        replaceInlineBits,
        getFirstChildElement
    ) {
        return ilk(function (res, src) {
            var contents =
                "<$ var bits = view.bits; view = view.view;\n $>" +
                res.getResource(src);

            template.mark(this, fugly(contents));
            root.mark(this, null);
            callback.mark(this);
            inlineBits.mark(this);

            resources.mark(this, res);
            source.mark(this, src);
        }).

        proto({
            /**
             * Renders the fugly-bit within the given html element (appended)
             * Another parameter may be passed as view, otherwise it will use
             * the view from the previous render call.
             *
             * @method render
             * @for fugly.bits.FuglyBit
             *
             * @param {HTMLElement} context
             * @param {mixed} view
             */
            render: function (context, view) {
                var doc = context.ownerDocument;

                this[populateBits](doc, view);
                context.appendChild(this[root]);
                this[finalizeBits](doc, view);
            },

            /**
             * Removes a previously rendered componente from its parent and
             * ditches its existing api.
             *
             * @method remove
             * @for fugly.bits.FuglyBit
             */
            remove: function () {
                delete this.api;

                var r = this[root];
                var p;

                if (r !== null) {
                    p = r.parentNode;
                    if (p !== null) {
                        p.removeChild(r);
                    }
                    this[root] = null;
                }
            }
        }).

        /**
         * @method populateBits
         * @for fugly.bits.FuglyBits
         * @private
         *
         * @param {HTMLDocument} ownerDocument
         * @param {mixed} view
         */
        proto(populateBits, parts.that(function (that, ownerDocument, view) {
            var tmp, bitsApi;

            this.remove();

            this[callback] = null;
            this[inlineBits] = [];

            tmp = ownerDocument.createElement("div");
            bitsApi =  function (f) { that[callback] = f; };
            bitsApi.inline = function (bits, view) {
                return that[inline](ownerDocument, bits, view);
            };

            tmp.innerHTML = this[template].render({
                bits: bitsApi,
                view: view
            });

            this[root] = this[getFirstChildElement](tmp);
            tmp.removeChild(this[root]);
            tmp = null;

            if (typeof this[callback] !== "function") {
                this[callback] = new Function("root", "view", this[resources].
                        getResource(this[source] + ".bits"));
            }
        })).

        proto(inline, function (ownerDocument, bits, view) {
            var id = uniqueId();
            this[inlineBits].push({
                id: id,
                bits: bits
            });

            bits[populateBits](ownerDocument, view);

            return "<div id=\"" + id + "\"></div>";
        }).

        proto(finalizeBits, function (ownerDocument, view) {
            this[replaceInlineBits](ownerDocument);
            this.api = this[callback].call(null, this[root], view) || {};
        }).

        proto(replaceInlineBits, function (ownerDocument) {
            parts.forEach(this[inlineBits], function (inline) {
                var bits = inline.bits;
                var placeHolder = ownerDocument.getElementById(inline.id);
                placeHolder.parentNode.
                    replaceChild(bits[root], placeHolder);
                placeHolder = null;

                bits[finalizeBits](ownerDocument);
            });
        }).

        /**
         * Returns the first element node from its child list.
         *
         * @method getFirstChildElement
         * @for fugly.bits.FuglyBits
         * @private
         *
         * @param {HTMLElement} n
         *
         * @return {HTMLElement}
         */
        proto(getFirstChildElement, function (n) {
            n = n.firstChild;
            do {
                if (n.nodeType === Node.ELEMENT_NODE) {
                    return n;
                }

                n = n.nextSibling;
            } while (n !== null);

            return null;
        });

    });

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

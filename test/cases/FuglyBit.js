(function () {
    "use strict";

    var assert = gabarito.assert;
    var matcher = gabarito.matcher;
    var sameAs = parts.sameAs;

    var body;
    var context;

    gabarito.test("fugly.bits.FuglyBit").

    before(function () {
        body = document.getElementsByTagName("body")[0];

        if (!body) {
            body = document.createElement("body");
            document.documentElement.appendChild(body);
        }

        context = document.createElement("div");
        body.appendChild(context);
    }).

    after(function () {
        body.removeChild(context);
        context = null;
    }).

    clause("FuglyBit should ask for the resource from the resources",
    function () {
        var resources = {
            getResource: gabarito.spy("")
        };

        var src = "src";
        new fugly.bits.FuglyBit(resources, src);

        resources.getResource.verify().args(src);
    }).

    clause(
    "render should use the resource as template, expose the api given by the" +
    " \"bits\" callback and append the first encountered element as root node" +
    " within the template into the passed context element",
    function () {
        var ts = new Date().getTime();

        var html = "<div id=\"id\"></div>";

        var template =
            html +
            "<$ " +
            "bits(function (root) {" +
            "   return {" +
            "       root: function () { return root; }, " +
            "       ts: function () { return " + ts + "; }" +
            "   };" +
            "}); " +
            "$>";

        var resources = { getResource: parts.constant(template) };
        var src = "src";

        var bit = new fugly.bits.FuglyBit(resources, src);
        bit.render(context);
        assert.that(context.innerHTML).sameAs(html);

        assert.that(bit.api.ts()).sameAs(ts);
        assert.that(bit.api.root()).sameAs(context.firstChild);
    }).

    clause("render should use the view as the view within the template",
    function () {
        var html = "<div id=\"id\"></div>";

        var template =
            html +
            "<$ " +
            "bits(function (root) {" +
            "   return {" +
            "       view: function () { return view; }" +
            "   };" +
            "}); " +
            "$>";

        var resources = { getResource: parts.constant(template) };
        var src = "src";

        var bit = new fugly.bits.FuglyBit(resources, src);

        var view = new Date().getTime();

        bit.render(context, view);

        assert.that(bit.api.view()).sameAs(view);
    }).

    clause(
    "remove should delete the \"api\" attribute and remove the root node " +
    "from it's parent node", function () {
        var html = "<div id=\"id\"></div>";

        var template =
            html +
            "<$ bits(function (root) { return {}; }); $>";

        var resources = { getResource: parts.constant(template) };
        var src = "src";

        var bit = new fugly.bits.FuglyBit(resources, src);

        bit.render(context);
        bit.remove();

        assert.that(bit).dhop("api");
        assert.that(context.childNodes.length).sameAs(0);
    }).

    clause("render should first call remove", function () {
        var html = "<div id=\"id\"></div>";

        var template =
            html +
            "<$ bits(function (root) { return {}; }); $>";

        var tmpDiv = {
            firstChild: { nodeType: Node.ELEMENT_NODE },
            removeChild: parts.k
        };

        var ownerDocument = { createElement: parts.constant(tmpDiv) };
        var resources = { getResource: parts.constant(template) };
        var src = "src";

        var bit = new fugly.bits.FuglyBit(resources, src);
        bit.remove = gabarito.spy();

        var context = {
            ownerDocument: ownerDocument,
            appendChild: gabarito.spy()
        };

        bit.render(context);

        var removeCall = bit.remove.verify();
        var appendCall = context.appendChild.verify();

        removeCall.before(appendCall);
    }).

    clause(
    "if \"bits\" hasn't been called, render should ask for a resource with " +
    "the same name suffixed with \".bits\" and use that resource as a " +
    "function body",
    function () {
        var ts = new Date().getTime();
        var html = "<div id=\"id\"></div>";
        var bits = "return { ts: function () { return " + ts + "; } };";
        var src = "src";

        var resources = {
            getResource: gabarito.spy(function (resource) {
                switch (resource) {
                    case src: return html;
                    case src + ".bits": return bits;
                }
            })
        };

        var bit = new fugly.bits.FuglyBit(resources, src);

        bit.render(context);

        resources.getResource.verify().args(src);
        resources.getResource.verify().args(src + ".bits");

        assert.that(bit.api.ts()).sameAs(ts);
    }).

    clause(
    "bits.inline should yield a bits within the parent bits current position " +
    "within the actual template",
    function () {
        var ts1 = new Date().getTime();
        var template =
            "<$ " +
            "view.inlineBit = new fugly.bits.FuglyBit(" +
                    "view.resources, " +
                    "\"inline\"); " +
            "$>" +
            "<div id=\"id\">" +
                "<$= bits.inline(view.inlineBit) $>" +
            "</div>" +
            "<$ bits(function (r) { return { ts: " + ts1 + " }; }); $>";

        var ts2 = ts1 + 1;
        var inlineTemplate =
            "<div id=\"inline-id\"></div>" +
            "<$ bits(function (r) { return { ts: " + ts2 + "}; }); $>";

        var resources = {
            getResource: gabarito.spy(function (resource) {
                switch (resource) {
                    case "src": return template;
                    case "inline": return inlineTemplate;
                }
            })
        };

        var bit = new fugly.bits.FuglyBit(resources, "src");
        var view = { resources: resources };
        bit.render(context, view);

        resources.getResource.verify().args("src");
        resources.getResource.verify().args("inline");

        assert.that(context.innerHTML).
                sameAs("<div id=\"id\"><div id=\"inline-id\"></div></div>");

        assert.that(bit.api.ts).sameAs(ts1);
        assert.that(view.inlineBit.api.ts).sameAs(ts2);

    });

}());

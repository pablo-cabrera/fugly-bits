(function () {
    "use strict";

    var assert = gabarito.assert;

    gabarito.test("fugly.bits.FuglyBit").

    clause("FuglyBit should ask for the resource from the resources",
    function () {
        var resources = {
            getResource: gabarito.spy("")
        };

        var src = "src";
        new fugly.bits.FuglyBit({}, resources, src);

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

        var tmpDiv = {
            firstChild: { nodeType: Node.ELEMENT_NODE },
            removeChild: gabarito.spy()
        };

        var ownerDocument = {
            createElement: gabarito.spy(parts.constant(tmpDiv))
        };

        var resources = { getResource: parts.constant(template) };
        var src = "src";

        var context = {
            appendChild: gabarito.spy()
        };

        var bit = new fugly.bits.FuglyBit(ownerDocument, resources, src);
        bit.render(context);

        ownerDocument.createElement.verify("div");

        assert.that(tmpDiv.innerHTML).sameAs(html);
        tmpDiv.removeChild.verify().args(tmpDiv.firstChild);

        assert.that(bit.api.ts()).sameAs(ts);
        assert.that(bit.api.root()).sameAs(tmpDiv.firstChild);
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

        var tmpDiv = {
            firstChild: { nodeType: Node.ELEMENT_NODE },
            removeChild: parts.k
        };


        var ownerDocument = { createElement: parts.constant(tmpDiv) };
        var resources = { getResource: parts.constant(template) };
        var src = "src";

        var bit = new fugly.bits.FuglyBit(ownerDocument, resources, src);

        var context = { appendChild: parts.k };
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

        var tmpDiv = {
            firstChild: { nodeType: Node.ELEMENT_NODE },
            removeChild: parts.k
        };

        var ownerDocument = { createElement: parts.constant(tmpDiv) };
        var resources = { getResource: parts.constant(template) };
        var src = "src";

        var bit = new fugly.bits.FuglyBit(ownerDocument, resources, src);

        var context = {
            appendChild: parts.k,
            removeChild: gabarito.spy()
        };

        tmpDiv.firstChild.parentNode = context;

        bit.render(context);
        bit.remove();

        assert.that(bit).dhop("api");
        context.removeChild.verify().args(tmpDiv.firstChild);
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

        var bit = new fugly.bits.FuglyBit(ownerDocument, resources, src);
        bit.remove = gabarito.spy();

        var context = { appendChild: gabarito.spy() };
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

        var tmpDiv = {
            firstChild: { nodeType: Node.ELEMENT_NODE },
            removeChild: parts.k
        };

        var ownerDocument = { createElement: parts.constant(tmpDiv) };
        var resources = {
            getResource: gabarito.spy(function (resource) {
                switch (resource) {
                    case src: return html;
                    case src + ".bits": return bits;
                }
            })
        };

        var bit = new fugly.bits.FuglyBit(ownerDocument, resources, src);

        var context = { appendChild: gabarito.spy() };
        bit.render(context);

        resources.getResource.verify().args(src);
        resources.getResource.verify().args(src + ".bits");

        assert.that(bit.api.ts()).sameAs(ts);
    });

}());

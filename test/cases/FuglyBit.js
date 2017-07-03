(function () {
    "use strict";

    var assert = gabarito.assert;
    var matcher = gabarito.matcher;
    var sameAs = parts.sameAs;

    gabarito.test("fugly.bits.FuglyBit").

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
            ownerDocument: ownerDocument,
            appendChild: gabarito.spy()
        };

        var bit = new fugly.bits.FuglyBit(resources, src);
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

        var bit = new fugly.bits.FuglyBit(resources, src);

        var context = {
            ownerDocument: ownerDocument,
            appendChild: parts.k
        };

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

        var bit = new fugly.bits.FuglyBit(resources, src);

        var context = {
            ownerDocument: ownerDocument,
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

        var bit = new fugly.bits.FuglyBit(resources, src);

        var context = {
            ownerDocument: ownerDocument,
            appendChild: gabarito.spy()
        };

        bit.render(context);

        resources.getResource.verify().args(src);
        resources.getResource.verify().args(src + ".bits");

        assert.that(bit.api.ts()).sameAs(ts);
    }).

    clause(
    "bits.inline should yield a bits within the parent bits current position " +
    "within the actual template",
    function () {
        var template =
            "<div id=\"id\">" +
                "<$= bits.inline(" +
                    "new fugly.bits.FuglyBit(view, \"inline\")) $>" +
            "</div>" +
            "<$ bits(function (r) { return {}; }); $>";

        var inlineTemplate =
            "<div id=\"inline-id\"></div>" +
            "<$ bits(function (r) { return {}; }); $>";

        var ownerDocument = {
            createElement: gabarito.spy(function () {
                return {
                    firstChild: { nodeType: Node.ELEMENT_NODE },
                    removeChild: parts.k
                };
            }),
            getElementById: gabarito.spy(function () {
                return { parentNode: { replaceChild: gabarito.spy() } };
            })

        };

        var resources = {
            getResource: gabarito.spy(function (resource) {
                switch (resource) {
                    case "src": return template;
                    case "inline": return inlineTemplate;
                }
            })
        };

        var context = {
            ownerDocument: ownerDocument,
            appendChild: parts.k
        };

        var bit = new fugly.bits.FuglyBit(resources, "src");
        bit.render(context, resources);

        resources.getResource.verify().args("src");
        resources.getResource.verify().args("inline");

        var byIdArgumentGrabber = matcher.grabber();
        var byIdReturnGrabber = matcher.grabber();
        ownerDocument.getElementById.verify().
            args(byIdArgumentGrabber).
            returning(byIdReturnGrabber);

        var tempId = byIdArgumentGrabber.grab();
        var byIdElement = byIdReturnGrabber.grab();

        var parentTempDivGrabber = matcher.grabber();
        ownerDocument.createElement.verify().returning(parentTempDivGrabber);
        var parentTempDiv = parentTempDivGrabber.grab();

        var expectedHtml =
            "<div id=\"id\">" +
                "<div id=\"" + tempId + "\"></div>" +
            "</div>";

        assert.that(parentTempDiv.innerHTML).sameAs(expectedHtml);

        var inlineTempDivGrabber = matcher.grabber();
        ownerDocument.createElement.verify().returning(inlineTempDivGrabber);
        var inlineTempDiv = inlineTempDivGrabber.grab();

        assert.that(inlineTempDiv.innerHTML).
                sameAs("<div id=\"inline-id\"></div>");

        byIdElement.parentNode.replaceChild.verify().
            args(
                matcher(sameAs(inlineTempDiv.firstChild)),
                matcher(sameAs(byIdElement)));

    });

}());

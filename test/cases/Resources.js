(function () {
    "use strict";

    var assert = gabarito.assert;

    gabarito.test("fugly.bits.Resources").

    clause("getResource should fetch a resource", function () {
        var resources = new fugly.bits.Resources(parts.k);
        var src = "a";
        var resource = "b";
        resources.fetchResource = gabarito.spy(parts.constant(resource));

        var result = resources.getResource(src);

        resources.fetchResource.verify().args(src);
        assert.that(result).sameAs(resource);
    }).

    clause("getResource should use an already fetched resource", function () {
        var resources = new fugly.bits.Resources(parts.k);
        var src = "a";
        var resource = "b";
        resources.fetchResource = gabarito.spy(parts.constant(resource));

        var result = resources.getResource(src);

        resources.fetchResource.verify().args(src);

        result = resources.getResource(src);
        assert.that(result).sameAs(resource);

        resources.fetchResource.noCalls();
    }).

    clause("fetchResource should request the resource using a XHR",
    function () {
        var xhr = {
            open: gabarito.spy(),
            send: gabarito.spy(),
            responseText: "responseText"
        };

        var src = "a";

        var factory = gabarito.spy(parts.constant(xhr));
        var resources = new fugly.bits.Resources(factory);

        var result = resources.fetchResource(src);

        factory.verify();

        var openCall = xhr.open.verify();
        var sendCall = xhr.send.verify();

        openCall.args("GET", src, false);
        sendCall.args(null);

        openCall.before(sendCall);

        assert.that(result).sameAs(xhr.responseText);
    }).

    clause("getResource should use a preloaded resource", function () {
        var resources = new fugly.bits.Resources(parts.k);
        var src = "a";
        var resource = "b";
        var preloaded = {};
        preloaded[src] = resource;

        resources.fetchResource = gabarito.spy();

        resources.preload(preloaded);

        var result = resources.getResource(src);
        assert.that(result).sameAs(resource);
        resources.fetchResource.noCalls();
    });

}());

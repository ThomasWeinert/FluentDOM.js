if (typeof FluentDOM === 'undefined') {
  var FluentDOM = require("../fluentdom").FluentDOM;
}

describe(
  "FluentDOM",
  function () {
    it(
      "should create a new element node",
      function () {
        var create = new FluentDOM(true).create;
        expect(create('foo').nodeName).toBe('foo');
      }
    );
    it(
      "should evaluate xpath",
      function () {
        var evaluate = (new FluentDOM('<xml/>')).evaluate;
        expect(evaluate('name(/xml)').toString()).toBe('xml');
      }
    );
  }
);
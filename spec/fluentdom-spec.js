if (typeof FluentDOM === 'undefined') {
  var FluentDOM = require("../fluentdom").FluentDOM;
}

describe(
  "FluentDOM",
  function () {
    it(
      "should create an element node",
      function () {
        var create = new FluentDOM(true).create;
        expect(create('foo').nodeName).toBe('foo');
      }
    );
    it(
      "should create an element node with text content and attribute",
      function () {
        var fd = new FluentDOM(true);
        expect(
          fd.xml(
            fd.create('foo', 'bar', {'attr' : 'value'})
          )
        ).toBe('<foo attr="value">bar</foo>');
      }
    );
    it(
      "should create an element node with a cdata section inside",
      function () {
        var fd = new FluentDOM(true);
        expect(
          fd.xml(
            fd.create('foo', fd.create.cdata('<div>content</div>'))
          )
        ).toBe('<foo><![CDATA[<div>content</div>]]></foo>');
      }
    );
    it(
      "should create an element node with a comment inside",
      function () {
        var fd = new FluentDOM(true);
        expect(
          fd.xml(
            fd.create('foo', fd.create.comment('a comment'))
          )
        ).toBe('<foo><!--a comment--></foo>');
      }
    );
    it(
      "should create an element node with a processing instruction inside",
      function () {
        var fd = new FluentDOM(true);
        expect(
          fd.xml(
            fd.create('foo', fd.create.pi('php', ' echo "Hello!"; '))
          )
        ).toBe('<foo><?php  echo "Hello!"; ?></foo>');
      }
    );
    it(
      "should evaluate xpath returning a string",
      function () {
        var evaluate = (new FluentDOM('<xml/>')).evaluate;
        expect(evaluate('name(/xml)')).toBe('xml');
      }
    );
    it(
      "should evaluate xpath returning a number",
      function () {
        var evaluate = (new FluentDOM('<xml>42.21</xml>')).evaluate;
        expect(evaluate('number(/xml)')).toBe(42.21);
      }
    );
    it(
      "should evaluate xpath returning nodes",
      function () {
        var fd = new FluentDOM('<xml><child>one</child><child>two</child></xml>');
        var result = '';
        fd.evaluate('/xml/child').each(
          function(index) {
            result += index + ': ' + this.textContent + ' ';
          }
        );
        expect(result).toBe('0: one 1: two ');
      }
    );
  }
);
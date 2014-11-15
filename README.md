FluentDOM.js
============

FluentDOM.js is a small library for DOM and XML handling.

It brings concepts from the original [FluentDOM](http://fluentdom.org) project back to JavaScript.

Basic usage
-----------

```javascript
fd = FluentDOM(true, { ns : 'urn:ns' })
```

The function `FluentDOM()` returns a new FluentDOM instance with a document a namespace resolver.

The first argument is a document or a boolean. If no argument is provided, or it is `false` the global variable
`document` will be used. If it is `true` a new Document instance will be created.

The second argument is used to resolve namespace prefixes. It can be an namespace resolver, a function
or an key-value object.

FluentDOM()::create
-------------------

This function allows for an simple syntax to create XML nodes. Just store the function into a local variable.
The example uses `_`, but it is your decision.

```javascript
var _ = FluentDOM().create;
document.querySelector('#demo').appendChild(
  _(
    'ul',
    _('li', 'one', {class : 'first'}),
    _('li', 'two'),
    _('li', 'three')
  )
);
```

The function can use the namespace resolver, and has another functions as properties to create special nodes.





/**
 * Get a FluentDOM builder instance
 *
 * You can provide a specific DOM document or a boolean. Boolean
 * true will create new document, false will fetch the global document.
 *
 * @param {Document|boolean} [dom]
 * @param {XPathNSResolver|Function|{}} [resolver]
 * @returns {FluentDOM}
 * @constructor
 */
var FluentDOM = function(dom, resolver) {

  if (window == this) {
    return new FluentDOM(dom, resolver);
  }

  /**
   * @param {XPathResult} result
   * @constructor
   */
  var NodeList = function(result) {
    this.result = result;
    this.items = [];
  };

  /**
   * @returns {Array}
   */
  NodeList.prototype.toArray = function() {
    var array = [];
    this.each(
      function() {
        array.push(this);
      }
    );
    return array;
  };

  /**
   * @param {Function} callback
   */
  NodeList.prototype.each = function(callback) {
    var index = 0, item;
    for (var i = 0; i < this.items.length; i++) {
      callback.call(this.items[i], index++);
    }
    if (this.result) {
      while (item = this.result.iterateNext()) {
        this.items.push(item);
        callback.call(item, index++);
      }
    }
    this.result = null;
  };

  /**
   * Consolidate the namespace resolver
   */
  var namespaces = (function(resolver) {
    var result;
    if (resolver instanceof Function && !resolver.lookupNamespaceURI instanceof Function) {
      result = resolver;
    } else if (resolver && resolver.lookupNamespaceURI instanceof Function) {
      result = resolver.lookupNamespaceURI;
    } else {
      result = function(list) {
        list = (list instanceof Object) ? list : {};
        return function(prefix) {
          if (prefix == '') {
            return null;
          }
          return list[prefix] || null;
        };
      }(resolver);
    }
    result.fromNodeName = function(nodeName) {
      var prefix;
      if (nodeName.indexOf(':') > -1) {
        prefix = nodeName.substr(0, nodeName.indexOf(':')) || '';
      } else {
        prefix = '#default';
      }
      return result(prefix);
    };
    return result;
  })(resolver);

  var append = function(node, value) {
    var i, namespace;
    if (value instanceof Node) {
      if (value instanceof Document) {
        if (value.documentElement) {
          node.appendChild(node.ownerDocument.importNode(value.documentElement, true));
        }
      } else {
        if (node.ownerDocument != value.ownerDocument) {
          value = node.ownerDocument.importNode(value, true);
        } else {
          value = value.cloneNode(true);
        }
        if (value instanceof Attr) {
          node.setAttributeNode(value);
        } else {
          node.appendChild(value);
        }
      }
    } else if (value instanceof Array) {
      for (i = 0; i < value.length; i++) {
        append(node, value[i]);
      }
      node.appendChild(dom.createTextNode(value));
    } else if (value instanceof Object){
      for (i in value) {
        if (!value.hasOwnProperty(i)) { continue; }
        if (namespace = namespaces.fromNodeName(i)) {
          node.setAttributeNS(namespaces.fromNodeName(i), i, value[i]);
        } else {
          node.setAttribute(i, value[i]);
        }
      }
    } else if (typeof value == 'string') {
      node.appendChild(dom.createTextNode(value.toString()));
    }
  };

  /**
   * Create an element node.
   *
   * @param {string} name
   * @param {...(string|Node|Object|Array)}
   * @returns {Element|*}
   */
  this.create = function(name) {
    var namespace, node;

    namespace = namespaces.fromNodeName(name);
    if (namespace) {
      node = dom.createElementNS(namespace, name);
    } else {
      node = dom.createElement(name);
    }
    for (var i = 1; i < arguments.length; i++) {
      append(node, arguments[i]);
    }

    return node;
  };
  this.create.cdata = function(content) {
    return dom.createCDATASection(content);
  };
  this.create.comment = function(content) {
    return dom.createComment(content);
  };
  this.create.pi = function(content) {
    return dom.createProcessingInstruction(content);
  };
  this.create.each = function(list, callback) {
    var fragment, node, i;
    callback = (callback instanceof Function) ? callback : function(item) { return item; };
    fragment = dom.createDocumentFragment();
    if (list instanceof Array) {
      for (i = 0; i < list.length; i++) {
        node = callback(list[i], i);
        if (node) {
          append(fragment, node);
        }
      }
    } else if (list instanceof Object) {
      for (i in list) {
        if (!list.hasOwnProperty(i)) { continue; }
        node = callback(list[i], i);
        if (node) {
          append(fragment, node);
        }
      }
    }
    return fragment;
  };

  this.document = function(node) {
    var result;
    if (dom.documentElement) {
      result = dom.implementation.createDocument('', '', null);
    } else {
      result = dom;
    }
    result.appendChild(node);
    result.save = function() {
      return (new XMLSerializer()).serializeToString(dom);
    };
    return result;
  };

  this.evaluate = function(expression, context, resultType) {
    context = context instanceof Node ? context : dom;
    resultType = resultType || XPathResult.ANY_TYPE;
    var result = dom.evaluate(
      expression,
      context,
      { lookupNamespaceURI : namespaces },
      resultType,
      null
    );
    switch (result.resultType) {
      case XPathResult.BOOLEAN_TYPE : return result.booleanValue;
      case XPathResult.NUMBER_TYPE : return result.numberValue;
      case XPathResult.STRING_TYPE : return result.stringValue;
      case XPathResult.FIRST_ORDERED_NODE_TYPE : return result.singleNodeValue;
      default :
        return new NodeList(result);
    }
  };

  if (dom === true) {
    dom = document.implementation.createDocument('', '', null);
  } else if (!(dom instanceof Document)) {
    dom = document;
  }
  if (dom && !dom.evaluate) {
    if (typeof installDOM3XPathSupport != 'undefined') {
      installDOM3XPathSupport(dom, new XPathParser());
    }
  }
};
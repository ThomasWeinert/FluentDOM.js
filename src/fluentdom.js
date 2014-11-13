var FluentDOM = function(dom, resolver) {

  if (window == this) {
    return new FluentDOM(dom, resolver);
  }

  var namespaces = (function(resolver) {
    var result;
    if (resolver instanceof Function && !resolver.lookupNamespaceURI instanceof Function) {
      result = resolver;
    } else if (resolver && resolver.lookupNamespaceURI instanceof Function) {
      result = resolver.lookupNamespaceURI;
    } else {
      result = function(namespaces) {
        namespaces = (namespaces instanceof Object) ? namespaces : {};
        return function(prefix) {
          if (prefix == '') {
            return null;
          }
          return namespaces[prefix] || null;
        };
      }(resolver);
    }
    result.fromNodeName = function(nodeName) {
      if (nodeName.indexOf(':') > -1) {
        prefix = nodeName.substr(0, nodeName.indexOf(':')) || '';
      } else {
        prefix = '#default';
      }
      return result(prefix);
    };
    return result;
  })(resolver);

  this.create = function(name) {

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

    var namespace = namespaces.fromNodeName(name);
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

  if (dom === true) {
    dom = document.implementation.createDocument('', '', null);
  } else if (!(dom instanceof Document)) {
    dom = document;
  }
};
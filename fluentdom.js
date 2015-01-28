var FluentDOM = (

  /**
   * @param exports
   * @returns {FluentDOM}
   */
  function(exports) {

    var imports = {
      DOMParser :
        (typeof DOMParser !== 'undefined') ? DOMParser : require('xmldom').DOMParser,
      XMLSerializer :
        (typeof XMLSerializer !== 'undefined') ? XMLSerializer : require('xmldom').XMLSerializer,
      DOMImplementation :
        (typeof document !== 'undefined') ? document.implementation : new (require('xmldom')).DOMImplementation
    };
    if (typeof document !== 'undefined') {
      if (!document.evaluate && (typeof xpath === 'undefined')) {
        throw "No Xpath support available";
      }
      imports.XPath = (typeof xpath === 'undefined') ? {} : xpath;
      imports.XPathResult =
        (typeof XPathResult !== 'undefined') ? XPathResult : xpath.XPathResult;
    } else {
      imports.XPath = require('xpath');
      imports.XPathResult = require('xpath').XPathResult;
    }

    /**
     * Get a FluentDOM builder instance
     *
     * You can provide a specific DOM document or a boolean. Boolean
     * true will create new document, false will fetch the global document.
     *
     * @signature `FluentDOM(source, mimetype)`
     * @param {any} [source]
     * @param {string} [mimetype]
     * @returns {FluentDOM}
     *
     * @signature `FluentDOM(source, resolver, mimetype)`
     * @param {any} [source]
     * @param {XPathNSResolver|Function|{}|string} [resolver]
     * @param {string} [mimetype]
     * @returns {FluentDOM}
     * @constructor
     */
    var FluentDOM = function(source, resolver, mimetype) {
      var dom;

      var NodeType = {
        ELEMENT_NODE : 1,
        ATTRIBUTE_NODE : 2,
        TEXT_NODE : 3,
        CDATA_SECTION_NODE : 4,
        ENTITY_REFERENCE_NODE : 5,
        ENTITY_NODE : 6,
        PROCESSING_INSTRUCTION_NODE : 7,
        COMMENT_NODE : 8,
        DOCUMENT_NODE : 9,
        DOCUMENT_TYPE_NODE : 10,
        DOCUMENT_FRAGMENT_NODE : 11,
        NOTATION_NODE : 12,

        validate : function(object, type) {
          if (type > 0) {
            return ((object instanceof Object) && (object.nodeType == type));
          } else {
            return ((object instanceof Object) && (object.nodeType > 0));
          }
        }
      };

      if (!(this instanceof FluentDOM)) {
        return new FluentDOM(source, resolver, mimetype);
      }

      if (typeof resolver == 'string') {
        mimetype = resolver;
      }
      mimetype = (typeof mimetype == 'string') ? mimetype : 'text/xml';

      if (NodeType.validate(source, NodeType.DOCUMENT_NODE)) {
        dom = source;
      } else if (!source || source === true) {
        if (!source && (typeof document !== 'undefined')) {
          dom = document;
        } else {
          dom = imports.DOMImplementation.createDocument('', '', null);
        }
      } else if ((FluentDOM.loaders instanceof Object) && FluentDOM.loaders[mimetype]) {
        dom = FluentDOM.loaders[mimetype](source, mimetype);
      } else if (
        (typeof source == 'string') &&
        ((mimetype == 'text/xml') || (mimetype == 'text/html'))
      ) {
        dom = (new imports.DOMParser()).parseFromString(source, mimetype)
      } else {
        throw "Can not load source as " + mimetype;
      }
      if (dom && !dom.evaluate) {
        dom.evaluate = function(expression, context, resolver, resultType) {
          if (resultType < 0 || resultType > 9) {
            throw {
              code: 0,
              toString: function() {
                return "Request type not supported";
              }
            };
          }
          return imports.XPath.createExpression(expression, resolver)
            .evaluate(context, resultType, null);
        };
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
        if (NodeType.validate(value)) {
          if (NodeType.validate(value, NodeType.DOCUMENT_NODE)) {
            if (value.documentElement) {
              node.appendChild(node.ownerDocument.importNode(value.documentElement, true));
            }
          } else {
            if (node.ownerDocument != value.ownerDocument) {
              value = node.ownerDocument.importNode(value, true);
            } else {
              value = value.cloneNode(true);
            }
            if (NodeType.validate(value, NodeType.ATTRIBUTE_NODE)) {
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
      this.create.pi = function(target, content) {
        return dom.createProcessingInstruction(target, content);
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
          return (new imports.XMLSerializer()).serializeToString(dom);
        };
        return result;
      };

      this.evaluate = function(expression, context, resultType) {
        context = NodeType.validate(context) ? context : dom;
        resultType = resultType || imports.XPathResult.ANY_TYPE;
        var result = dom.evaluate(
          expression,
          context,
          { lookupNamespaceURI : namespaces },
          resultType,
          null
        );
        switch (result.resultType) {
          case imports.XPathResult.BOOLEAN_TYPE : return result.booleanValue;
          case imports.XPathResult.NUMBER_TYPE : return result.numberValue;
          case imports.XPathResult.STRING_TYPE : return result.stringValue;
          case imports.XPathResult.FIRST_ORDERED_NODE_TYPE : return result.singleNodeValue;
          default :
            return new NodeList(result);
        }
      };

      this.xml = function(node) {
        var context;
        if (node) {
          context = node;
        } else {
          context = dom;
        }
        return (new imports.XMLSerializer()).serializeToString(context);
      };
    };

    FluentDOM.loaders = {};

    // non-node wrapper
    if (typeof exports !== 'undefined' ) {
      exports.FluentDOM = FluentDOM;
    }

    return FluentDOM;
 }
)(typeof exports !== 'undefined' ? exports : {});

var util = require("util");

var JechoClient = {

  initialized: false,

  version: "0",

  useXHR: false,

  buffer: [],

  init: function() {

    var _self = this;

    this.serverURL = this.getServerURL();

    var oldOnError = window.onerror;
    window.onerror = function (message, filename, lineno) {
      _self.send('e', "JS error captured: [" + message + "] in [" + filename + ":" + lineno + "]");
      if (typeof oldOnError == 'function') {
        return oldOnError(message, filename, lineno);
      }
      return false;
    }

    if (!this.useXHR) {

      this.wsocket = new WebSocket(this.serverURL.replace("http", "ws"));

      this.wsocket.addEventListener("open", function(event) {

        _self.wsSend('l', navigator.userAgent);

        for (var i=0; i < _self.buffer.length; i++) {
          _self.wsSend( _self.buffer[i].type, _self.buffer[i].data );
        }

        _self.buffer.length = 0;

      });

      this.wsocket.addEventListener("message", function(event) {

        var command = event.data.split(" "), args;
        var result, fn;

        switch (command[0]) {

          case '!':
            args = command.slice(1).join(" ");
            try {
              (function() { result = window.eval.call(window, args); })();
              _self.wsSend( '!', result );
            } catch(e) {
              if (typeof result != 'undefined') {
                _self.wsSend( '!' , Object.getOwnPropertyNames(result).sort() );
              } else {
                _self.wsSend( 'e', "Error: " + e.message);
              }
            }
            break;
        }
      });

      this.wsocket.addEventListener("close", function(event) {
        this.initialized = false;
      });

    } else {
      this.send('l', navigator.userAgent);
    }

    this.initialized = true;

    return this;
  },

  wsSend: function(type, data) {

    var msg = { type: type, data: (typeof data == 'undefined' ? 'JS UNDEFINED' : ( data === null ? 'JS NULL' : data ) ) };

    if (this.wsocket.readyState === 0) {
      this.buffer.push(msg);
      return;
    }

    this.wsocket.send( JSON.stringify( msg ) );
  },

  xhrSend: function( type, data ) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', this.serverURL + 'log', true);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    xhr.send( JSON.stringify( { type: type, data: data } ) );
  },

  send: function( type, data ) {
    this.useXHR ? this.xhrSend( type, data ) : this.wsSend( type, data );
  },

  log: function(m) {

    if (!this.initialized) {
      this.init();
    }

    this.send( 'l', m );
  },

  safariVersion: function() {
    return parseInt(window.navigator.userAgent.match(/Version\/(.*?)\s/)[1][0], 10);
  },

  isSafariOnIOS: function() {
    return !!window.navigator.userAgent.match(/safari/i) && !!window.navigator.userAgent.match(/(iPad|iPhone|iPod)/i);
  },

  getServerURL: function(list) {
    var pattern = /(http(s?):\/\/(.*?)\/)/
      , match;

    script = findScript();

    match = pattern.exec(script.src);

    return match ? match[1] : null;

    function findScript() {
      var elements = (list || document.getElementsByTagName("script"))
        , scripts = ["jecho.", "jecho.min."]
        , i
        , j
        , element;

      for (i = 0; i < elements.length; i++) {
        element = elements[i];
        for (j=0; j < scripts.length; j++) {
          if (-1 != element.src.indexOf("/" + scripts[j])) {
            return element;
          }
        }
      }
    }
  }
};

JechoClient._toJavaScript = function() {

  var lines = [], i=0;
  var asString;

  lines[i++] = ";(function(window) {";
  lines[i++] = "var jecho = {";

  for (var x in this) {
    if (x[0] == '_') {
      continue;
    }
    asString = this[x].toString();
    lines[i++] = "  " + x + ": " + ( util.isArray(this[x]) ? ( "[" + asString + "]" ) : asString ) + ",";
  }
  lines[i++] = "};";
  lines[i++] = "window.jecho = jecho.init();";
  lines[i++] = "})(this);";

  return lines.join("\n");

}

exports.JechoClient = JechoClient;

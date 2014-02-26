
var util = require("util");

var JechoClient = {

  initialized: false,

  version: "0",

  nMessages: 0,

  useXHR: false,

  buffer: [],

  supportsWebSockets: function() {

    if (typeof(WebSocket) != "function") {
      return false;
    }

    var UA = window.navigator.userAgent.toLowerCase();

    if (/chrome|firefox/.test(UA)) {
      return true;
    }

    // Supports WebSockets on Android WebViews and Default Browser only if the OS version is > 4.3
    var test = UA.match(/android\s(\d)\.(\d)/);
    if (test && parseInt(test[1], 10) < 4 || (parseInt(test[1], 10) > 3 && parseInt(test[2], 10) < 4)) {
      return false;
    }

    return true;
  },

  init: function() {

    var _self = this;

    this.serverURL = this.getServerURL();

    var oldOnError = window.onerror;
    window.onerror = function (message, filename, lineno) {
      _self.send('e', "JS error captured: [" + message + "] in [" + filename + ":" + lineno + "]", true);
      if (typeof oldOnError == 'function') {
        return oldOnError(message, filename, lineno);
      }
      return false;
    }

    if ( !this.useXHR && !this.supportsWebSockets() ) {
      this.useXHR = true;
      this.send('e', "Client does not support WebSockets: falling back to XHR.");
    }

    if (!this.useXHR) {

      this.wsocket = new WebSocket(this.serverURL.replace("http", "ws"));

      this.wsocket.addEventListener("open", function(event) {

        _self.wsSend('i', navigator.userAgent);

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
      this.send('i', navigator.userAgent);
    }

    this.initialized = true;

    return this;
  },

  wsSend: function(type, data) {

    var msg = this.formatMessage(type, data);

    if (this.wsocket.readyState === 0) {
      this.buffer.push(msg);
      return;
    }

    this.wsocket.send( this.prepareMessage( msg ) );
  },

  xhrSend: function( type, data ) {
    var msg = this.formatMessage(type, data);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', this.serverURL + 'log', true);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    xhr.send( this.prepareMessage(msg) );
  },

  formatMessage: function(type, data) {
    var msg = { id: this.nMessages, type: type, data: (typeof data == 'undefined' ? 'JS UNDEFINED' : ( data === null ? 'JS NULL' : (typeof data == 'function' ? data.toString() : data ) ) ) };
    return msg;
  },

  send: function( type, data ) {
    if (type == "l") {
      this.nMessages++;
    }
    this.useXHR ? this.xhrSend( type, data ) : this.wsSend( type, data );
  },

  prepareMessage: function(msg) {
    try {
      return JSON.stringify( msg );
    } catch(e) {
      return JSON.stringify( this.formatMessage('e', "Cannot serialize object" ) );
    }
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
  },

  inspect: function(el, cssProp) {

    var report = [], style, i=0;

    if (typeof el == "string") {
      return;
    }

    if (!el || el == window) {
      report[i++] = "Screen: " + screen.width + " x " + screen.height + " (avail: " + screen.availWidth + " x " + screen.availHeight + ")";
      report[i++] = "Inner / Outer: " + window.innerWidth + " x " + window.innerHeight + " / " + window.outerWidth + " x " + window.outerHeight;
      report[i++] = "Orientation: " + window.orientation;
      el = window.document.documentElement;
    }

    report[i++] = "Client: " + el.clientWidth + " x " + el.clientHeight;

    if (typeof window.getComputedStyle == "function") {
      style = window.getComputedStyle(el);
      report[i++] = "Style: " + style.width + " x " + style.height;
      if (cssProp && cssProp in style) {
        report[i++] = cssProp + ": " + style[cssProp];
      }
    }

    report[i++] = "Offset: H " + el.offsetHeight+ ", W " + el.offsetWidth + ", T " + el.offsetTop + ", L " + el.offsetLeft;
    report[i++] = "Scroll: H " + el.scrollHeight+ ", W " + el.scrollWidth + ", T " + el.scrollTop + ", L " + el.scrollLeft;

    this.send( 'l', "\n" + report.join("\n") );
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

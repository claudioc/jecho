// Extends the core String object to add a simple ANSI colouring
// https://github.com/Yuffster/npm-string-ansi/blob/master/string-ansi.js
String.prototype.color = function() {
  if (!arguments) {
    return this;
  } 

  var colors, code = '';

  if (arguments.length == 1 && typeof colors == "string") {
    colors = [arguments[i]];
  }

  colors = arguments;
  for (var i = 0; i < colors.length; i++) {
    code += ANSI.get(colors[i]);
  }

  return code + this + ANSI.get('reset');
};

var ANSI = {

  'prefix'    : "\u001B[",
  'suffix'    : "m",

  //Styles

  'reset'     :  0,
  'bold'      :  1,
  '/bold'     : 22,
  'italic'    :  3,
  '/italic'   : 23,
  'underline' :  4,
  '/underline': 24,
  'conceal'   :  8,
  'strike'    :  9,
  '/strike'   : 29,
  'reverse'   :  7,
  'blink'     :  5,
  'blink2'    :  6,

  //Colors

  'black'     : 30,
  'red'       : 31,
  'green'     : 32,
  'yellow'    : 33,
  'blue'      : 34,
  'purple'    : 35,
  'cyan'      : 36,
  'white'     : 37,
  'default'   : 39,

  //Backgrounds

  'bgblack'   : 40,
  'bgred'     : 41,
  'bggreen'   : 42,
  'bgyellow'  : 43,
  'bgblue'    : 44,
  'bgpurple'  : 45,
  'bgcyan'    : 46,
  'bgwhite'   : 47,
  'bgdefault' : 49,

  'get': function(color) {
    var code = this[color];
    if (code === false) {
      return 0;
    } 
    return this.prefix + code + this.suffix;
  }

};


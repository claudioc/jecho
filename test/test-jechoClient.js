
var jc = require("../lib/JechoClient").JechoClient;

exports.initialization = function(test){
  test.expect(4);
  
  test.deepEqual(jc.initialized, false);
  test.deepEqual(jc.buffer.length, 0);
  test.deepEqual(jc.version, "0");
  test.deepEqual(jc.useXHR, false);
  
  test.done();
};

exports.getServerURL = function(test) {
  
  var scripts = [
    { src: "http://google.com/foo.js" },
    { src: "https://pippo.com/jecho.js" },
    { src: "http://zot.com/jecho.js" }
  ];

  test.equal(jc.getServerURL(scripts), "https://pippo.com/");

  scripts = [
    { src: "http://google.com/foo.js" },
    { src: "http://pippo.com/jecho.js" },
    { src: "http://zot.com/jecho.js" }
  ];

  test.equal(jc.getServerURL(scripts), "http://pippo.com/");

  test.done();
};

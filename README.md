
JECHO
======

jecho is a client/server remote debugging tool written for Node.js, which aims to ease the (sad) life of the
mobile web developer. It can be used with almost every browser, even desktop ones, but in those
cases much more powerful debug tools already exist.

Basically you run the jecho server and you receive a command line. Whatever string you enter
from this command line is then sent to the (eventually) connected client(s) (i.e.: a web page opened
in a mobile device). That string is then eval'uated in the browser as JavaScript code and the result sent back
to the server, which in turn will display it.

Additionally, a `jecho.log()` utility is provided to be used from within the web page, so that you can send
asynchronous messages to the server. The `jecho.log()` obviously resembles the console.log() tool, but it isn't powerful that much: the serialization of objects is just a `JSON.stringify(obj, undefined, 2)`.

Features
--------

- supports bidirectional communication, thanks to WebSockets. The support is provided for the legacy and current WebSocket specifications (tested on iOS 4, 5, 6 and some versions of Android).
- if for some reasons WebSockets are not supported, then you can still use the `jecho.log()` thanks to XMLHttpRequest and CORS. In this case you'll not be able to send commands to the browser, but just receive the output from jecho.log.
- command line handled by readline with history (saved in ~/.jecho-history)
- uses smart eval() - meaning that "var foobar" will create a real, global foobar
- automatically catches and report JavaScript errors (not using window.onerror, so joy with Firefox)

Output
------

Each output line is composed by four elements: a timestamp, the IP address of the client, and indicator and the message
The indicator element is a symbol with the following meanings:
- `>>` a log message has been received from the client (unattended)
- `<>` a response to a query has been received by the client
- `>!` an error has been captured by the client
- `--` internal message (not from the client)

Please note the `undefined` and `null` values are printed as `JS UNDEFINED` and `JS NULL`

Limitations
-----------

I've it tested roughly in a lot of different environments, but mostly on WebKit based browser. It also works on Firefox and Opera Mini. Expect differences on how browsers handle the serialization of objects (like `window.location`).

If more than one client connects to the jecho server (you see the number reported in the console prompt), you'll be able to send commands only to the last one which "talked".

Installation
------------

`npm install jecho`

or download everything and just run `npm install`

Dependencies: `websocket`, `websocket-server`, `commander`

Note for OSX brew users: npm is not installed along the installation of nodejs (a package manager won't install another package manager).
Just run `brew install npm` and read the provided instructions.

Note for Ubuntu users: everything is fine, except for users of some old 11.x distribution (problems with... Python. Don't ask).

Usage
-----

Run the jecho server with -h to read about a couple of options it accepts.

Insert a JavaScript script tag in the page which you want to enhance with jecho:

```html
<script src="http://<jecho server ip address and port>/jecho.js"></script>
<script>
 jecho.log("Hello from the jecho client!");
</script>
```

License
-------
(The MIT License)

Copyright (c) 2012 Claudio Cicali <claudio.cicali@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Credits
-------

Claudio Cicali <claudio.cicali@gmail.com>, [@caludio](http://twitter.com/caludio) on Twitter

[wcauchois](https://github.com/wcauchois/websocket-fallback) who provided the nice wrapper for the WebSockets fallback

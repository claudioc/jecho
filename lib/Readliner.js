
var util     = require("util")
  , events   = require('events')
  , readline = require("readline")
  , fs       = require('fs')
  , path     = require('path');

var Readliner = function() {

  events.EventEmitter.call(this);

  try {
    this.interface = readline.createInterface({
      input: process.stdin,
      output: process.stdout
      //  completer: completer
    });
  } catch (e) { // For node 0.6.x
    this.interface = readline.createInterface(process.stdin, process.stdout, null);
  }

  this.historyFile = '.jecho-history';

  this.previousLine = null;

  this.interface.on('SIGINT', (function() {
    this.interface.close();
    console.log("\n<Press ^C again to exit>");
  }).bind(this));

  this.interface.on('line', (function(line) {
    this.emit("line", line);
    this.writeHistory(line);
  }).bind(this));

  /*
  function completer(line) {
    var completions = ''.split(' ')
    var hits = completions.filter(function(c) { return c.indexOf(line) == 0 })
    return [hits.length ? hits : completions, line]
  }
  */
}

util.inherits(Readliner, events.EventEmitter);

Readliner.prototype.prompt = function() {
  this.interface.prompt(true);
}

Readliner.prototype.loadHistory = function() {
  // 0.8.x moved exists on fs
  var existsSync = (fs.existsSync) ? fs.existsSync : path.existsSync;

  var filePath = path.join(process.env.HOME, this.historyFile);
  if (!existsSync(filePath)) {
    return [];
  }
  var cmdHistory = fs.readFileSync(filePath, 'utf8').split('\n');
  // filter and reverse and limit
  cmdHistory = cmdHistory.filter(function(line) { return line.trim().length > 0; });
  // @todo: also filter two identical commands one after another
  return cmdHistory.reverse().slice(0, 200);
}

Readliner.prototype.writeHistory = function(line) {
  if (line.trim().length>0 && !(this.previousLine && this.previousLine == line)) {
    this.previousLine = line;
    this.history.write(line + '\n');
  }
}

Readliner.prototype.start = function() {
  this.history = fs.createWriteStream(path.join(process.env.HOME, this.historyFile), { flags: 'a' });
  this.interface.history = this.loadHistory();
  this.interface.prompt(true);
}

Readliner.prototype.setPrompt = function(p) {
  this.interface.setPrompt(p);
}

exports.Readliner = Readliner

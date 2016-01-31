#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
//var yaml = require('js-yaml');
var wait = require('wait.for');

var handlerFile = path.resolve(process.cwd() + '/index.js');
var jouleFile = path.resolve(process.cwd() + '/../.joule.yml');
var eventsFile = path.resolve(process.cwd() + '/events.json');

var context = {
  succeed: function(input) {
    console.log(input);
  },
  fail: function(input) {
    console.log(input);
  }
};

var events;

try {
  events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
  if(!events) {
    console.log('Unable to JSON parse ' + eventsFile + '.');
    return;
  } else if(!events['events']) {
    console.log('Unable to find `events[\'events\']` in events.json file.');
    return;
  }

  if(typeof(events.env) === 'object') {
    for(var envKey in events.env) {
      process.env[envKey] = events.env[envKey];
    }
  }
} catch(e) {
  if (e.code == 'ENOENT') {
    console.log('Failed to read ' + eventsFile + '.');
  } else {
    console.log('Exception when trying to access or parse ' + eventsFile + '.');
  }
  return;
}

var init = function() {
};

var run = function(method, payload) {
  var handler = require(handlerFile);
  payload.httpMethod = method;
  wait.for(handler.handler, payload, context);
};

init();
var i;
var callEvents = events['events'];
for(var method in callEvents) {
  for(i=0; i<callEvents[method].length; i++) {
    wait.launchFiber(run, method, callEvents[method][i]);
  }
}

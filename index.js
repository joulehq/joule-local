#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var wait = require('wait.for');
var yaml = require('js-yaml');

var handlerFile = path.resolve(process.cwd() + '/index.js');
var jouleFile = path.resolve(process.cwd() + '/../.joule.yml');
var eventsFile = path.resolve(process.cwd() + '/events.json');

var context = {
  succeed: function(input) {
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

try {
  yaml = yaml.safeLoad(fs.readFileSync(jouleFile, 'utf8'));
} catch(e) {
  console.log(e);
  return;
}

var mapRequestIntoPayload = function(method, path, payload) {
  var apiPath = ''
      , apiQuery = ''
      , apiQueryAsObject = {}
      , pathAsArray
      , returnedPayload = {httpMethod: method};

  // check if path has a ?
  if(path.indexOf('?') === -1) {
    apiPath = path;
  } else {
    apiPath = path.substr(0, path.indexOf('?'));
    apiQuery = path.substr(path.indexOf('?')+1);
    var tmp1 = apiQuery.split('&')
        , tmp1parts;
    for(var tmp1cnt=0; tmp1cnt<tmp1.length; tmp1cnt++) {
      tmp1parts = tmp1[tmp1cnt].split('=');
      apiQueryAsObject[tmp1parts[0]] = tmp1parts[1];
    }
  }

  if(method === 'POST') {
    returnedPayload['post'] = payload;
  } else if(method === 'GET') {
    for (var attrname in payload) { apiQueryAsObject[attrname] = payload[attrname]; }
  }

  pathAsArray = apiPath.split('/').slice(3);

  returnedPayload['path'] = pathAsArray;
  returnedPayload['query'] = apiQueryAsObject;
  return returnedPayload;
};

var run = function(method, path, payload) {
  var handler = require(handlerFile), mappedPayload;
  console.log('');
  console.log(method + ' ' + path + ' ' + JSON.stringify(payload));
  try {
    payload = mapRequestIntoPayload(method, path, payload);
    wait.for(handler.handler, payload, context);
  } catch(e) {
    console.log('FAILURE: ' + e.message);
  }
};

var i;
var callEvents = events['events'];
for(var method in callEvents) {
  for(var path in callEvents[method]) {
    for(var i=0; i<callEvents[method][path].length; i++) {
      wait.launchFiber(run, method, path, callEvents[method][path][i]);
    }
  }
}

var Response = require('../../node_modules/joule-node-response');
exports.handler = function(event, context) {
  var response = new Response();
  response.setContext(context);
  switch(event.httpMethod) {
    case 'GET':
      response.send(event);
      break;
    case 'POST':
      response.send(event);
      break;
  }
};

var response = require('../../node_modules/joule-node-response');
exports.handler = function(event, context) {
  switch(event.httpMethod) {
    case 'GET':
      response.success200(context, 'yes');
  }
};

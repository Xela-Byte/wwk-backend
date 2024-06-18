'use strict';
module.exports = (router, routes) => {
  router.use(`/`, routes); // Route all traffic with base endpoint.
  router.get('/', (_, response) => {
    response.status(200).json({
      statusCode: 200,
      statusMessage: 'You touched WashWithKings base route.',
    }); // Response for home route
  });
};


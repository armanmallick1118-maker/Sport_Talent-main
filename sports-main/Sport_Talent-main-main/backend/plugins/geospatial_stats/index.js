const geoRoutes = require('./geoRoutes');

module.exports = {
  name: 'Geospatial Statistics Radar',
  baseRoute: '/api/v1/plugins/geospatial',
  router: geoRoutes,
};

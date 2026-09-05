const featureRoutes = require('./featureRoutes');

module.exports = {
    name: 'Example Feature',
    baseRoute: '/api/v1/plugins/example',
    router: featureRoutes
};

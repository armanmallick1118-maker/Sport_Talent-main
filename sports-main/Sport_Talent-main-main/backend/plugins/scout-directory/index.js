const scoutRoutes = require('./scoutRoutes');

module.exports = {
    name: 'Scout Directory',
    baseRoute: '/api/v1/scouts',
    router: scoutRoutes
};

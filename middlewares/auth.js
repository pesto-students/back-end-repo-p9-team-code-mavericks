const { authenticate } = require('../service/jwt_authentication')

async function restrictToLoggedInUserOnly(req, res, next) {
	authenticate(req, res, next);
}

module.exports = {
	restrictToLoggedInUserOnly,
}
var express = require('express');
var router = express.Router();
const { handleUserSignUp, handleUserLogin } = require('../controllers/user');
const {handleFinishSignUp} = require('../controllers/user');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.json({ "status": "server is running for ci/cd testing."});
});

router.post('/signup', handleUserSignUp);
router.post('/login', handleUserLogin);
router.post('/finishsignup', handleFinishSignUp);

module.exports = router;

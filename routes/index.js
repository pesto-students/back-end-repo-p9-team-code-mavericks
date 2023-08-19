var express = require('express');
var router = express.Router();
const { handleUserSignUp, handleUserLogin } = require('../controllers/user');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.json({ "status": "Up and running on port 3000"});
});

router.post('/signup', handleUserSignUp);
router.post('/login', handleUserLogin);
module.exports = router;
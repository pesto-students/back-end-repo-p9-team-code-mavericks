const jwt = require('jsonwebtoken');
// require('dotenv').config();
const secretKey = 'my-secret-key';

function generateToken(user){
    const payload = {userId: user._id, email:user.email, username: user.username};
    // Generate a JWT token with the payload and secret key
    const token = jwt.sign(payload, secretKey);
    return token;
}

function authenticate(req, res, next) {
    // Retrieve the token from the cookie or request headers
    const token = req.cookies.token || req.headers.authorization;
  
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    try {
      // Verify and decode the token using the secret key
      const decoded = jwt.verify(token, secretKey);
  
      // Retrieve the user ID from the decoded token and attach it to the request object
      req.userId = decoded.userId;
      req.userName = decoded.username;

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  
  module.exports = {
    generateToken,
    authenticate,
  };
  
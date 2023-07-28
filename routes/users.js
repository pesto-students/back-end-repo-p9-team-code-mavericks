const express = require('express');
const router = express.Router();

const { handleUnfollowUser, handleGetFollowingsList, handleGetUserIdByUsername, handleIsFollowing, handleGetUserIdByEmail, handleFollowUser, handleLoggedInUser, handleUserLogout, handleGetFollowersList, handleGetBookmarkList } = require('../controllers/user');

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
  console.log("User id is " + req.userId);
});

router.get('/getloggedinuser', handleLoggedInUser);
router.get('/follow/:username', handleFollowUser);
router.get('/email/:useremail', handleGetUserIdByEmail)
router.get('/isfollowing/:username', handleIsFollowing);
router.get('/logout', handleUserLogout);
router.get('/username/:username', handleGetUserIdByUsername);
router.get('/followers',handleGetFollowersList);
router.get('/followings',handleGetFollowingsList);
router.get('/bookmarklist', handleGetBookmarkList);
router.post('/unfollow', handleUnfollowUser);

module.exports = router;

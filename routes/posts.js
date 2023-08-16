const express = require('express');
const router = express.Router();
const upload = require('../middlewares/file_upload_storage');
const { handleGetIfPostLikedAndBookmarkedByUser, handleGetPostDetailsByPostId, handleSearch, handleMostLiked, handleGetAllPostsByUsername, handleFileUpload, handleBookmarkPost, handleCreatePost, handleRetrievePost, handleUpdateLike } = require('../controllers/posts');


router.post('/create', handleCreatePost);
router.get('/retrieve/:page', handleRetrievePost);
router.post('/like', handleUpdateLike);
router.get('/bookmark/:id/:flag', handleBookmarkPost);
router.post('/img/upload', upload.array('files'), handleFileUpload);
router.get('/allposts/:username', handleGetAllPostsByUsername);
router.get('/mostliked/', handleMostLiked);
router.get('/search/:keyword', handleSearch);
router.get('/getpost/:id', handleGetPostDetailsByPostId);
router.get('/isliked/isbookmarked/:postid/:username', handleGetIfPostLikedAndBookmarkedByUser);

module.exports = router;

const express = require('express');
const router = express.Router();

const { handleBookmarkPost, handleCreatePost, handleRetrievePost, handleUpdateLike } = require('../controllers/posts');


router.post('/create', handleCreatePost);
router.get('/retrieve/:page', handleRetrievePost);
router.post('/like', handleUpdateLike);
router.get('/bookmark/:id/:flag', handleBookmarkPost);

module.exports = router;

const express = require('express');
const router = express.Router();

const { handleCreatePost, handleRetrievePost, handleUpdateLike } = require('../controllers/posts');


router.post('/create', handleCreatePost);
router.get('/retrieve', handleRetrievePost);
router.patch('/like', handleUpdateLike);

module.exports = router;

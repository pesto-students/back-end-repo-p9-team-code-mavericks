const express = require('express');
const router = express.Router();
const upload = require('../middlewares/file_upload_storage');
const { handleFileUpload, handleBookmarkPost, handleCreatePost, handleRetrievePost, handleUpdateLike } = require('../controllers/posts');


router.post('/create', handleCreatePost);
router.get('/retrieve/:page', handleRetrievePost);
router.post('/like', handleUpdateLike);
router.get('/bookmark/:id/:flag', handleBookmarkPost);
router.post('/img/upload', upload.array('files'), handleFileUpload);

module.exports = router;

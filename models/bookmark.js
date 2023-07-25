const mongoose = require('mongoose');

// Define the user schema
const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, unique: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'posts', required: true },
}, {
  timestamps: true,
},);

const BookmarksModel = mongoose.model('bookmarks', bookmarkSchema);

module.exports = BookmarksModel;
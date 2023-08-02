const mongoose = require('mongoose');

// Define the user schema
const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'posts', required: true },
}, {
  timestamps: true,
},);

// Create a compound index on userId and postId to ensure uniqueness
bookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });

const BookmarksModel = mongoose.model('bookmarks', bookmarkSchema);

module.exports = BookmarksModel;
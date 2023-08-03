const mongoose = require('mongoose');

// Define the user schema
const likesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'posts', required: true },
}, {
  timestamps: true,
},);

// Create a compound index on userId and postId to ensure uniqueness
likesSchema.index({ userId: 1, postId: 1 }, { unique: true });

const LikesModel = mongoose.model('likes', likesSchema);

module.exports = LikesModel;
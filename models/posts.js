const mongoose = require('mongoose');

// Define the user schema
const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref:'users', required: true },
  author_username: {type: String, require:true},
  recipe_title: { type: String, required: true },
  recipe_description: { type: String },
  recipe_picture: { type: [String] },
  recipe_likes: { type: Number, required: false },
  ispublic: {type: Boolean, require: true},
}, {
  timestamps: true,
},);

const PostsModel = mongoose.model('posts', postSchema);
module.exports = PostsModel;
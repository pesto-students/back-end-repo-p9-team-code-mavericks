const mongoose = require('mongoose');

// Define the user schema
const postsInDetailSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref:'posts', required: true, unique: true},
  recipe_category: { type: String, required: true },
  recipe_ingredients: { type: [String], required: true },
  recipe_steps: { type: String, required: true },
}, {
  timestamps: true,
},);

const PostsInDetailModel = mongoose.model('postsindetail', postsInDetailSchema);

module.exports = PostsInDetailModel;
const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  contact: { type: String },
  interests: { type: [String] },
  last_active: { type: Date },
  liked_posts: {type: [mongoose.Schema.Types.ObjectId]},
}, {
  timestamps: true,
},);

const UserModel = mongoose.model('users', userSchema);

module.exports = UserModel;
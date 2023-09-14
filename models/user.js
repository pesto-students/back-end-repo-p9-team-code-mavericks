const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstname: { type: String, required: false },
  lastname: { type: String, required: false },
  contact: { type: String },
  interests: { type: [String] },
  last_active: { type: Date },
  liked_posts: {type: [mongoose.Schema.Types.ObjectId]},
  is_public: {type: Boolean, default: true},
  contact_hidden: {type: Boolean, default: false},
  email_hidden: {type: Boolean, default: false},
  followers_hidden: {type: Boolean, default: false},
  following_hidden: {type: Boolean, default: false},
  first_time_login: {type: Boolean, default: true},
  signup_completed: {type: Boolean, default: false},
}, {
  timestamps: true,
},);

// Create unique indexes for 'email' and 'username' fields
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

const UserModel = mongoose.model('users', userSchema);

module.exports = UserModel;
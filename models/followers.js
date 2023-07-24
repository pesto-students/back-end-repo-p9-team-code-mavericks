const mongoose = require('mongoose');

// Define the user schema
const followerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, unique: true },
  followers: { type: [mongoose.Schema.Types.ObjectId], ref: 'users', required: true },
}, {
  timestamps: true,
},);

const FollowersModel = mongoose.model('followers', followerSchema);

module.exports = FollowersModel;
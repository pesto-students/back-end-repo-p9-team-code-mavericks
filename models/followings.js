const mongoose = require('mongoose');

// Define the user schema
const followingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', unique: true },
  followings: { type: [mongoose.Schema.Types.ObjectId], ref: 'users'},
}, {
  timestamps: true,
},);

followingsSchema.index({ userId: 1 }, { unique: true });

const FollowingsModel = mongoose.model('followings', followingsSchema);

module.exports = FollowingsModel;
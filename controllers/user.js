const UserModel = require('../models/user');
const FollowersModel = require('../models/followers');
const FollowingsModel = require('../models/followings');
const BookmarksModel = require('../models/bookmark');
const PostsModel = require('../models/posts');

const bcrypt = require('bcrypt');
const { generateToken } = require('../service/jwt_authentication');

async function handleInterests(req, res){
  const loggedInUserId = req.userId;
  const { interests } = req.body;
  try {
    const userRec = await UserModel.findByIdAndUpdate(loggedInUserId, { interests, first_time_login: false }, { new: true });

    if (!userRec) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'User first_time_login set to false successfully', userRec });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ err: 'Server error: '+err });
  }

}

async function handleGetBookmarkList(req, res){
  const loggedInUser = req.userId;
  try{
    const bookmarkPostsIds = await BookmarksModel.distinct('postId', { userId: loggedInUser });
    const bookmarkedPosts = await PostsModel.find({ _id: { $in: bookmarkPostsIds }}, {_id:0, __v:0} );
    res.json({bookmarks: bookmarkedPosts});
  } catch(err){
    res.status(500).json({error: err});
  }
}

async function handleUnfollowUser(req, res){
  const loggedInUser = req.userId; 
  const unfollowUserId = req.body.userId;

  try{
    const followingUpdate = await FollowingsModel.updateOne(
      { userId: loggedInUser },
      { $pull: { followings: unfollowUserId } }
    );
  }catch(err){
    res.json({error: "Something went wrong while updating followings table of logged in user: "+err});
  }
  
  
  try{
    const followersUpdate = await FollowersModel.updateOne(
      { userId: unfollowUserId },
      { $pull: { followers: loggedInUser } }
    );
  }catch(err){
    res.json({error: "Something went wrong while updating followers table of logged in user: "+err});
  }

  res.status(200).json({message: "You unfollowed the user successfully."});
}

async function handleGetFollowersList(req, res){

  // Get current logged in user Id.
  const loggedInUserId = req.userId;

  // Get username that was passed in get request.
  const ofUser = req.params.ofuser;

  // Set -> looking for followers of user that is currently logged in.
  let lookForUserId = loggedInUserId;

  // if logged in user is diff from user whose followers are requested. 
  if(ofUser != req.userName){
    try{
      const ofUserRec = await UserModel.findOne({username: ofUser});

      if(!ofUserRec){
        return res.status(404).json({error: "User not found."});
      }

      // Check if the profile of user passed in get request is public.
      if(!ofUserRec.is_public){
        return res.status(401).json({error: "User profile is not public"});
      }

      // Check if user that was passed in get request allows others to view their followers.
      if(ofUserRec.followers_hidden){
        return res.status(401).json({error: "User don't allow to view their followers."});
      }
      
      // Set -> Looking for followers of user that was passed in get request.
      lookForUserId = ofUserRec._id;
    } catch(err){
      res.status(500).json({error: "Error:"+err});
    }
  }

  // Now get all the followers of user that was set in 'lookForUserId' variable.
  try{
    const allFollowersRec = await FollowersModel.findOne({userId: lookForUserId});
    if(allFollowersRec){
      const allFollowersId = allFollowersRec.followers;
      const allFollowers = await UserModel.find({ _id: { $in: allFollowersId }},{ _id: 0, username: 1, firstname: 1, lastname: 1 });
      res.json({followers:allFollowers});
    }
    else
      res.json({followersError: "Didn't find any followers."});
  } catch(err){
    res.json({error: err});
  }  
}

async function handleGetFollowingsList(req, res){
  // Get current logged in user Id.
  const loggedInUserId = req.userId;

  // Get username that was passed in get request.
  const ofUser = req.params.ofuser;

  // Set -> looking for following of user that is currently logged in.
  let lookForUserId = loggedInUserId;

  // if logged in user is diff from user whose followings list is requested. 
  if(ofUser != req.userName){
    try{
      const ofUserRec = await UserModel.findOne({username: ofUser});

      if(!ofUserRec){
        return res.status(404).json({error: "User not found."});
      }

      // Check if the profile of user passed in get request is public.
      if(!ofUserRec.is_public){
        return res.status(401).json({error: "User profile is not public"});
      }

      // Check if user that was passed in get request allows others to view their followers.
      if(ofUserRec.following_hidden){
        return res.status(401).json({error: "User don't allow to view their followings."});
      }
      
      // Set -> Looking for followers of user that was passed in get request.
      lookForUserId = ofUserRec._id;
    } catch(err){
      res.status(500).json({error: "Error:"+err});
    }
  }

  try{
    const allFollowingsRec = await FollowingsModel.findOne({userId: lookForUserId});
    if(allFollowingsRec){
      const allFollowingIds = allFollowingsRec.followings;
      const allFollowings = await UserModel.find({ _id: { $in: allFollowingIds }},{ _id: 0, username: 1, firstname: 1, lastname: 1 });
      res.json({followings:allFollowings});
    }
    else
      res.status(404).json({message: "Didn't find any such logged in user"});
  } catch(err){
    res.json({error: err});
  }  
}

async function handleLoggedInUser(req, res) {
  try {
    const retrievedUser = await UserModel.findById(req.userId).exec();
    if (!retrievedUser) {
      return res.json({ error: 'User not found' });
    }
    const userDetails = {
      email: retrievedUser.email,
      username: retrievedUser.username,
      firstname: retrievedUser.firstname,
      lastname: retrievedUser.lastname,
      contact: retrievedUser.contact,
      liked_posts: retrievedUser.liked_posts,
    }
    return res.status(200).json({ message: 'Successfully retrieved', user_details: userDetails });
  } catch (error) {
    console.error('Error retrieving user:', error);
    return res.status(500).json({ error: 'Failed during retrieval of user' });
  }
}

async function handleUserSignUp(req, res) {
  try {
    const { firstname, lastname, contact, email, password, username } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user object based on the UserModel
    const newUser = new UserModel({
      email: email,
      password: hashedPassword,
      firstname: firstname,
      lastname: lastname,
      contact: contact,
      username: username,
    });

    // Save the new user to the database
    const createdUser = await newUser.save();

    // Check if the user was created successfully
    if (createdUser) {
      // Return a JSON response indicating success
      return res.status(200).json({ message: 'User created successfully' });
    } else {
      // Return a JSON response indicating failure
      return res.status(500).json({ error: 'Failed to create user' });
    }
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function handleUserLogin(req, res) {
  const { email, password } = req.body;
  const userQuery = await UserModel.findOne({ email });
  if (!userQuery) {
    return res.json({ error: "User don't exists." });
  }

  const match = await bcrypt.compare(password, userQuery.password);
  if (!match) {
    return res.status(401).send('Invalid email or password');
  }

  const token = generateToken(userQuery);
  const userName = userQuery.username;
  const firstTimeLogin = userQuery.first_time_login;

  res.cookie('token', token);
  return res.status(200).json({ message: 'User logged in successfully', username: userName, token: token, first_time_login: firstTimeLogin });
}

async function handleUserLogout(req, res) {
  // Clear the JWT token from the browser's cookies
  res.clearCookie('token');
  
  // Send a response to indicate successful logout
  res.status(200).json({ message: 'Logged out successfully' });
}

async function handleFollowUser(req, res) {
  const loggedInUserId = req.userId;
  const followUsername = req.params.username;
  try {
    const userRec = await UserModel.findOne({ username: followUsername });
    if (!userRec) {
      return res.status(404).json({ message: "User with such username to follow is not found." });
    }
    else {
      const followUserId = userRec._id;
      if(followUserId == loggedInUserId){
        return res.status(400).json({error: "You cannot follow yourself"});
      }

      // Update Followers list of followUserid
      try {
        const updatedRec1 = await FollowersModel.findOneAndUpdate(
          { userId: followUserId, followers: { $ne: loggedInUserId } },
          { $addToSet: { followers: loggedInUserId } },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.log("error from followers update:\n " + err);
        return res.status(500).json({ error: err });
      }

      // Update Followings list of loggedInUserId
      try {
        const updatedRec2 = await FollowingsModel.findOneAndUpdate(
          { userId: loggedInUserId, followings: { $ne: followUserId } },
          { $addToSet: { followings: followUserId } },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.log("error from followings update:\n " + err);
        return res.status(500).json({ error: err });
      }

    }
  } catch (error) {
    console.log("Something went wrong while trying to find user to follow by its email.");
    return res.json({ message: "500: Internal server error." });
  }

  return res.status(200).json({ message: "You have followed the user succesfully!" });
}

async function handleIsFollowing(req, res) {
  const loggedInUser = req.userId;
  const userNameToCheck = req.params.username;

  try {
    const userRec = await UserModel.findOne({ username: userNameToCheck });

    if (!userRec) {
      return res.status(404).json({ message: "User with such username to follow is not found." });
    }
    else {
      const userIdToCheck = userRec._id;
      if(userIdToCheck == loggedInUser){
        return res.status(200).json({message:"You already follow yourself"});
      }
      try{
        const rec = await FollowingsModel.findOne({userId:loggedInUser, followings: { $in: [userIdToCheck] }});
        if(!rec){
          return res.status(404).json({message:"You are not following this user"});
        }
        else{
          return res.status(200).json({message:"You are already following this user"});
        }
      } catch(err){
        return res.json({error:err});
      }
    }
  } catch (error) {
    console.log("Something went wrong while trying to find user by its username to follow.");
    return res.json({ message: "500: Internal server error." });
  }

}

// API using this controller should not be provided to any third party as it return the user_id. Only for internal use.
async function handleGetUserIdByEmail(req, res) {
  const userEmail = req.params.useremail;
  try {
    const userRec = await UserModel.findOne({ email: userEmail });
    if (!userRec) {
      return res.status(404).json({ message: "User with such email not found." });
    }
    else {
      return res.status(200).json({ message: userRec._id });
    }
  } catch (error) {
    console.log("Something went wrong while trying to find user by its email.");
    return res.json({ message: "500: Internal server error." });
  }
}

// API using this controller should not be provided to any third party as it return the user_id. Only for internal use.
async function handleGetUserDetailsByUsername(req, res) {
  const userName = req.params.username;
  try {
    const userRec = await UserModel.findOne({ username: userName }, {_id: 0});
    if (!userRec) {
      return res.status(404).json({ Error: "User with such username not found." });
    }
    else {
      const respObj = {username: userRec.username, firstname: userRec.firstname, lastname: userRec.lastname };
      if(!userRec.is_public)
        return res.status(200).json({ user_details: respObj});
      if(!userRec.email_hidden)
        respObj['email'] = userRec.email;
      if(!userRec.contact_hidden)
        respObj['contact'] = userRec.contact;

      return res.status(200).json({user_details: respObj});
    }
  } catch (error) {
    console.log("Something went wrong while trying to find user by its username.");
    return res.json({ message: "500: Internal server error." });
  }
}

module.exports = {
  handleIsFollowing,
  handleUserSignUp,
  handleUserLogin,
  handleLoggedInUser,
  handleUserLogout,
  handleFollowUser,
  handleGetUserIdByEmail,
  handleGetUserDetailsByUsername,
  handleGetFollowersList,
  handleGetFollowingsList,
  handleGetBookmarkList,
  handleUnfollowUser,
  handleInterests,
}
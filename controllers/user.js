const UserModel = require('../models/user');
const FollowersModel = require('../models/followers');
const FollowingsModel = require('../models/followings');

const bcrypt = require('bcrypt');
const { generateToken } = require('../service/jwt_authentication');


async function handleGetFollowersList(req, res){
  const loggedInUser = req.userId;
  try{
    const allFollowersRec = await FollowersModel.findOne({userId: loggedInUser});
    if(allFollowersRec)
      res.json({followers:allFollowersRec.followers});
    else
      res.json({followersError: "Didn't find any such logged in usere"});
  } catch(err){
    res.json({error: err});
  }  
}

async function handleGetFollowingsList(req, res){
  const loggedInUser = req.userId;
  console.log("Logged in user is ", loggedInUser);
  try{
    const allFollowingsRec = await FollowingsModel.findOne({userId: loggedInUser});
    if(allFollowingsRec)
      res.json({message:allFollowingsRec.followings});
    else
      res.json({message: "Didn't find any such logged in usere"});
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
    return res.json({ message: 'Successfully retrieved', email: retrievedUser.email, username: retrievedUser.username });
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
  res.cookie('token', token);
  return res.status(200).json({ message: 'User logged in successfully' });
}

async function handleUserLogout(req, res) {
  // Need to implement
  return res.status(200).json({ message: 'User logged out needs to be implemented' });
}

async function handleFollowUser(req, res) {
  const loggedInUserId = req.userId;
  const followUsername = req.params.username;
  console.log(followUsername);
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
    console.log('username to check '+userNameToCheck);
    console.log('userRec is :'+userRec)
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
async function handleGetUserIdByUsername(req, res) {
  const userName = req.params.username;
  try {
    const userRec = await UserModel.findOne({ username: userName });
    if (!userRec) {
      return res.status(404).json({ message: "User with such username not found." });
    }
    else {
      return res.status(200).json({ message: userRec._id });
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
  handleGetUserIdByUsername,
  handleGetFollowersList,
  handleGetFollowingsList
}
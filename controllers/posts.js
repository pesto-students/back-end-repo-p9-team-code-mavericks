const PostsModel = require('../models/posts');
const FollowingsModel = require('../models/followings');
const mongoose = require('mongoose');

async function handleCreatePost(req, res){
  try {
    const { ispublic, recipe_steps, recipe_ingredients, recipe_category, recipe_thumbnail, recipe_name } = req.body;
    const author = req.userId;

    // Create a new Post object based on the PostsModel
    const newPost = new PostsModel({
      author: author,
      recipe_name: recipe_name,
      recipe_thumbnail: recipe_thumbnail,
      recipe_category: recipe_category, 
      recipe_ingredients: recipe_ingredients, 
      recipe_steps: recipe_steps, 
      ispublic: ispublic,
      recipe_likes: 0,
    });

    // Save the new Post to the database
    const createdPost = await newPost.save();

    // Check if the Post was created successfully
    if (createdPost) {
      // Return a JSON response indicating success
      return res.status(200).json({ message: 'Post created successfully' });
    } else {
      // Return a JSON response indicating failure
      return res.status(500).json({ error: 'Failed to create Post' });
    }
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}


async function handleRetrievePost(req, res){
  const loggedInUserId = req.userId; // Assuming you have a middleware that sets the user in the request object after successful authentication
  
  try {
    // Step 1: Fetch the users that the logged-in user follows
    const followingUsers = await FollowingsModel.findOne({userId: loggedInUserId});

    if(followingUsers){
      // Step 2: Fetch recent posts from users that the logged-in user follows
      const recentPostsFromFollowing = await PostsModel.find({ author: { $in: followingUsers.followings } }).limit(10);
      console.log('Posts are: ',recentPostsFromFollowing);

      // // Step 3: Fetch random posts based on previous liked posts and interests
      // const previousLikedPosts = loggedInUser.likedPosts; // Assuming you have a field 'likedPosts' in your user schema that stores the IDs of posts the user has liked
      // const userInterests = loggedInUser.interests; // Assuming you have a field 'interests' in your user schema that stores the user's interests

      // const randomPostsBasedOnLikedPosts = await Post.aggregate([
      //   { $match: { _id: { $nin: previousLikedPosts } } }, // Exclude previously liked posts
      //   { $sample: { size: 5 } }, // Sample 5 random posts
      // ]);

      // const randomPostsBasedOnInterests = await Post.aggregate([
      //   { $match: { tags: { $in: userInterests } } }, // Match posts with tags that match user's interests
      //   { $sample: { size: 5 } }, // Sample 5 random posts
      // ]);

      // Combine the results from different sources
      let postFeed = [
        ...recentPostsFromFollowing,
        // ...randomPostsBasedOnLikedPosts,
        // ...randomPostsBasedOnInterests,
      ];

      // Sort the post feed based on the latest posts
      postFeed.sort((a, b) => b.createdAt - a.createdAt);

      // // Implement pagination
      // const page = req.query.page || 1;
      // const perPage = 10; // Number of posts to show per page
      // const startIndex = (page - 1) * perPage;
      // const endIndex = page * perPage;
      // const totalPosts = postFeed.length;

      // const paginatedPosts = postFeed.slice(startIndex, endIndex);

      // res.json({
      //   posts: paginatedPosts,
      //   currentPage: page,
      //   totalPages: Math.ceil(totalPosts / perPage),
      // });
      res.json({message: postFeed});
    }
    else{
      res.json({message:"No followings"});
    }
  } catch (err) {
    console.error("Error retrieving posts:", err);
    res.status(500).json({ error: "Error retrieving posts" });
  }
}


async function handleUpdateLike(req, res){
  try {
    const { postId, incDecCnt } = req.body; // Assuming you pass the document ID in the request body

    // Update the recipe_likes using findOneAndUpdate with $inc operator
    const updatedDocument = await PostsModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(postId) }, // Query to find the document by its ID
      { $inc: { recipe_likes: incDecCnt } }, // Increment the recipe_likes by 1 (or any other number)
      { new: true } // Return the updated document instead of the old one
    );

    if (!updatedDocument) {
      return res.status(404).json({ message: 'Document not found' });
    }

    return res.status(200).json(updatedDocument);
  } catch (err) {
    console.error('Error updating recipe_likes:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

module.exports = {
  handleRetrievePost,
  handleCreatePost,
  handleUpdateLike
}
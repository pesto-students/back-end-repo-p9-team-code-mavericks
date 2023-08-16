const PostsModel = require('../models/posts');
const FollowingsModel = require('../models/followings');
const mongoose = require('mongoose');
const BookmarksModel = require('../models/bookmark');
const PostsInDetailModel = require('../models/posts_in_detail');
const LikesModel = require('../models/like');
const PostModel = require('../models/posts');
const UserModel = require('../models/user');

async function handleFileUpload(req, res) {
  const filePaths = req.files.map(file => file.path);
  res.json({ filePaths });
}

async function handleSearch(req, res) {
  try{
    const keyword = req.params.keyword;
    const postMatches = await PostModel.find({ recipe_title: { $regex: `^${keyword}`, $options: 'i' } }).select('author_username recipe_title').limit(10).lean();

    const userMatches = await UserModel.find({
      $or: [
        { username: { $regex: `^${keyword}`, $options: 'i' } }, // Case-insensitive search
        { firstname: { $regex: `^${keyword}`, $options: 'i' } },
        { lastname: { $regex: `^${keyword}`, $options: 'i' } }
      ],
    }).select('username firstname lastname -_id').limit(10).lean();

    res.status(200).json({posts:postMatches, users:userMatches});
  } catch(err) {
    res.status(500).json({error: "Internal server error: "+err});
  }
}
async function handleMostLiked(req, res){
  try{
    const topPosts = await PostsModel.find()
      .sort({ recipe_likes: -1 }) // Sort in descending order based on recipe_likes
      .limit(4); // Limit the results to 5 posts
      res.status(200).json({most_liked_posts:topPosts});
  } catch(err) {
    res.status(500).json({error: 'Internal Server error: '+err});
  }
}

async function handleGetAllPostsByUsername(req, res) {
  const user = req.params.username;
  let userId;

  try{
    const userRec = await UserModel.findOne({username: user});
    if(!userRec){
      return res.status(404).json({error:'No such user exists'});
    }
    userId = userRec._id;
  } catch(err) {
    return res.status(500).json({error: 'Internal server error: '+err});
  }

  try {
    const postRec = await PostModel.find({ author: userId });
    if (!postRec) {
      return res.status(200).json({ followers_count: 0 });
    }

    return res.status(200).json({ posts: postRec });
  } catch (err) {
    console.error('Error retrieving user posts:'+err);
    res.status(500).json({ error: 'An error occurred while fetching posts of the user: '+err });
  }

}

async function handleBookmarkPost(req, res){
  const postId = req.params.id;
  const bookmarkFlag = req.params.flag;
  const loggedInUser = req.userId;

  if(bookmarkFlag == '1'){
    const newRec = new BookmarksModel({
      userId: loggedInUser,
      postId: postId,
    });

    const createBookMark = await newRec.save();

    if (createBookMark) {
      return res.status(200).json({ status: 200 });
    } else {
      return res.status(500).json({ error: 'Failed to bookmark the post.' });
    }
  }else if(bookmarkFlag == '0'){
    try {
      const result = await BookmarksModel.deleteOne({ userId: loggedInUser, postId: postId });
      res.status(200).json({message: 'Post un-bookmarked successfully:'});
    } catch (error) {
      res.status(404).json({error:'Post un-bookmark failed with error: '+ error});
    }
  }
}


async function handleCreatePost(req, res){
  try {
    const { ispublic, recipe_steps, recipe_ingredients, recipe_category, recipe_description, recipe_title, recipe_picture } = req.body;
    const authorId = req.userId;
    const authorUsername = req.userName;

    // Create a new Post object based on the PostsModel
    const newPost = new PostsModel({
      author: authorId,
      author_username: authorUsername,
      recipe_title: recipe_title,
      recipe_description: recipe_description,
      ispublic: ispublic,
      recipe_likes: 0,
      recipe_picture: recipe_picture,
    });

    // Save the new Post to the database
    const createdPost = await newPost.save();

    // Check if the Post was created successfully
    if (createdPost) {
      const newPostsInDetail = new PostsInDetailModel({
        post_id: createdPost._id,
        recipe_category: recipe_category, 
        recipe_ingredients: recipe_ingredients, 
        recipe_steps: recipe_steps, 
      });

      const createPostsInDetailRec = await newPostsInDetail.save();

      if(createPostsInDetailRec)
        return res.status(200).json({ message: 'Post created successfully' });
      else
        return res.status(500).json({error: 'Failed to create record in in-detail posts section.'});
    } else {
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
  const loggedInUserId = req.userId;

  try {
    // Step 1: Fetch the users that the logged-in user follows
    const followingUsers = await FollowingsModel.findOne({userId: loggedInUserId});

    if(followingUsers){
      // Step 2: Fetch recent posts from users that the logged-in user follows
      const recentPostsFromFollowing = await PostsModel.aggregate([
        {
          $match: { author: { $in: followingUsers.followings } }
        },
        {
          $lookup: {
            from: 'bookmarks',
            let: { postId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$postId', '$$postId'] },
                      { $eq: ['$userId', new mongoose.Types.ObjectId(loggedInUserId)] } // Check if the post is bookmarked by the logged-in user
                    ]
                  }
                }
              }
            ],
            as: 'bookmarkData'
          }
        },
        {
          $lookup: {
            from: 'likes',
            let: { postId: '$_id'},
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$postId', '$$postId'] },
                      { $eq: ['$userId', new mongoose.Types.ObjectId(loggedInUserId)] } // Check if the post is liked by the logged-in user
                    ]
                  }
                }
              }
            ],
            as: 'likesData'
          }
        },
        {
          $addFields: {
            bookmarked: {
              $cond: {
                if: { $gt: [{ $size: '$bookmarkData' }, 0] },
                then: true,
                else: false
              }
            },
            liked: {
              $cond: {
                if: {$gt: [{$size: '$likesData'}, 0]},
                then: true,
                else: false
              }
            },
          }
        },
        {
          $project: {
            bookmarkData: 0, // Exclude the bookmarkData field
            likesData: 0,
          }
        },
      ]);
      
      let postFeed = [
        ...recentPostsFromFollowing,
      ];

      // Sort the post feed based on the latest posts
      postFeed.sort((a, b) => b.createdAt - a.createdAt);

      // Implement pagination
      const page = req.params.page || 1;
      const perPage = 2; // Number of posts to show per page
      const startIndex = (page - 1) * perPage;
      const endIndex = page * perPage;
      const totalPosts = postFeed.length;

      // Calculate total pages based on the number of posts and the perPage value
      const totalPages = Math.ceil(totalPosts / perPage);

      // Check if the requested page is greater than the total number of pages
      if (page > totalPages) {
        return res.status(404).json({ error: 'Requested page out of range' });
      }

      const paginatedPosts = postFeed.slice(startIndex, endIndex);

      res.json({
        posts: paginatedPosts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / perPage),
      });
      // res.json({feeds: postFeed});
    }
    else{
      res.json({error:"No followings"});
    }
  } catch (err) {
    console.error("Error retrieving posts:", err);
    res.status(500).json({ error: "Error retrieving posts" });
  }
}

// Function to handle liking/disliking a post with atomicity
async function handleUpdateLike(req, res) {
  const loggedInUserId = req.userId;
  const {postId, likeFlag} = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the post and update 'likes_cnt' field
    const updateQuery = likeFlag == '1' ? { $inc: { recipe_likes: 1 } } : { $inc: { recipe_likes: -1 } };
    const updatedPost = await PostModel.findOneAndUpdate({ _id: postId }, updateQuery, {
      new: true,
      session,
    });

    // Insert or delete the like record in LikesModel
    if (likeFlag == '1') {
      const createLikes = await LikesModel.create([{ userId: loggedInUserId, postId: postId }], { session });
    } else {
      await LikesModel.deleteOne({ userId: loggedInUserId, postId: postId }, { session });
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({message: "Updated the likes data", total_likes: updatedPost.recipe_likes});
  } catch (err) {
    // If any error occurs, abort the transaction and handle the error
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({error: "Error occured while updating likes "+err});
  }
}

module.exports = {
  handleRetrievePost,
  handleCreatePost,
  handleUpdateLike,
  handleBookmarkPost,
  handleFileUpload,
  handleGetAllPostsByUsername,
  handleMostLiked,
  handleSearch
}
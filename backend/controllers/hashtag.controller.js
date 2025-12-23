import Post from '../models/post.model.js';

// Extract hashtags from text
const extractHashtags = (text) => {
  if (!text) return [];
  const regex = /#(\w+)/g;
  const matches = text.match(regex);
  return matches ? matches.map(tag => tag.toLowerCase()) : [];
};

// Get Trending Hashtags
export const getTrendingHashtags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get posts from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts = await Post.find({
      createdAt: { $gte: sevenDaysAgo }
    }).select('description');

    // Extract and count hashtags
    const hashtagCounts = {};
    
    posts.forEach(post => {
      const hashtags = extractHashtags(post.description);
      hashtags.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });

    // Sort by count and get top N
    const trending = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      success: true,
      trending
    });

  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch trending hashtags' 
    });
  }
};

// Search Posts by Hashtag
export const searchByHashtag = async (req, res) => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const searchTag = tag.startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`;

    const posts = await Post.find({
      description: { $regex: searchTag, $options: 'i' }
    })
    .populate('author', 'firstName lastName userName profileImage headline')
    .populate('comment.user', 'firstName lastName profileImage headline')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Post.countDocuments({
      description: { $regex: searchTag, $options: 'i' }
    });

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Search by hashtag error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to search posts' 
    });
  }
};
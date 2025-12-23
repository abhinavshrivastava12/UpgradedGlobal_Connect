import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import Connection from '../models/connection.model.js';

// Get User Analytics
export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const { period = '7d' } = req.query; // 7d, 30d, 90d, all

    // Calculate date range
    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else startDate = new Date(0); // all time

    // Get user posts in period
    const posts = await Post.find({
      author: userId,
      createdAt: { $gte: startDate }
    });

    // Calculate metrics
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, post) => sum + (post.like?.length || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.comment?.length || 0), 0);
    const totalViews = totalLikes + totalComments; // Approximate engagement

    // Get connection growth
    const newConnections = await Connection.countDocuments({
      $or: [
        { sender: userId, status: 'accepted', createdAt: { $gte: startDate } },
        { receiver: userId, status: 'accepted', createdAt: { $gte: startDate } }
      ]
    });

    // Get profile views (if you implement profile view tracking)
    const profileViews = 0; // Placeholder

    // Calculate engagement rate
    const engagementRate = totalPosts > 0 
      ? ((totalLikes + totalComments) / totalPosts).toFixed(2)
      : 0;

    // Get most liked post
    const mostLikedPost = posts.reduce((max, post) => {
      return (post.like?.length || 0) > (max?.like?.length || 0) ? post : max;
    }, null);

    // Daily breakdown
    const dailyStats = {};
    posts.forEach(post => {
      const date = post.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { posts: 0, likes: 0, comments: 0 };
      }
      dailyStats[date].posts++;
      dailyStats[date].likes += post.like?.length || 0;
      dailyStats[date].comments += post.comment?.length || 0;
    });

    res.json({
      success: true,
      analytics: {
        period,
        overview: {
          totalPosts,
          totalLikes,
          totalComments,
          totalViews,
          engagementRate,
          newConnections,
          profileViews
        },
        mostLikedPost: mostLikedPost ? {
          id: mostLikedPost._id,
          description: mostLikedPost.description?.substring(0, 100),
          likes: mostLikedPost.like?.length || 0,
          comments: mostLikedPost.comment?.length || 0
        } : null,
        dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          ...stats
        }))
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch analytics' 
    });
  }
};

// Get Network Analytics
export const getNetworkAnalytics = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .populate('connection', 'firstName lastName headline profileImage');

    // Analyze connections
    const connectionHeadlines = {};
    user.connection?.forEach(conn => {
      if (conn.headline) {
        const industry = conn.headline.split(' ')[0]; // Simple industry extraction
        connectionHeadlines[industry] = (connectionHeadlines[industry] || 0) + 1;
      }
    });

    // Top industries
    const topIndustries = Object.entries(connectionHeadlines)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([industry, count]) => ({ industry, count }));

    // Connection growth over time
    const connectionGrowth = await Connection.aggregate([
      {
        $match: {
          $or: [{ sender: user._id }, { receiver: user._id }],
          status: 'accepted'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      analytics: {
        totalConnections: user.connection?.length || 0,
        topIndustries,
        connectionGrowth: connectionGrowth.map(item => ({
          month: item._id,
          connections: item.count
        }))
      }
    });

  } catch (error) {
    console.error('Get network analytics error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch network analytics' 
    });
  }
};

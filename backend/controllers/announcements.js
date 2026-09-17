const { Announcement } = require('../models');

// Get Announcements
async function getAnnouncements(req, res) {
  try {
    const { department } = req.user;
    // Show announcements for their department OR 'All'
    const list = await Announcement.find({
      $or: [
        { department: department },
        { department: 'All' }
      ]
    });

    // Sort descending by date
    const sorted = list.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Create Announcement
async function createAnnouncement(req, res) {
  try {
    const { name, role, department } = req.user;
    const { title, content, targetDept, type } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const post = await Announcement.create({
      department: targetDept || 'All',
      title,
      content,
      postedBy: `${name} (${role})`,
      type: type || 'announcement',
      pinned: false,
      reactions: [],
      comments: []
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Add Emoji Reaction
async function reactToAnnouncement(req, res) {
  try {
    const { name } = req.user;
    const { id } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    const post = await Announcement.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    let reactions = [...(post.reactions || [])];
    const emojiIdx = reactions.findIndex(r => r.emoji === emoji);

    if (emojiIdx === -1) {
      reactions.push({ emoji, users: [name] });
    } else {
      const userIdx = reactions[emojiIdx].users.indexOf(name);
      if (userIdx === -1) {
        reactions[emojiIdx].users.push(name);
      } else {
        // Toggle off reaction
        reactions[emojiIdx].users.splice(userIdx, 1);
        if (reactions[emojiIdx].users.length === 0) {
          reactions.splice(emojiIdx, 1);
        }
      }
    }

    const updated = await Announcement.findByIdAndUpdate(id, { reactions }, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

// Add Comment
async function addComment(req, res) {
  try {
    const { name } = req.user;
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const post = await Announcement.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const comment = { sender: name, text, timestamp: new Date() };
    const comments = [...(post.comments || []), comment];

    const updated = await Announcement.findByIdAndUpdate(id, { comments }, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  getAnnouncements,
  createAnnouncement,
  reactToAnnouncement,
  addComment
};

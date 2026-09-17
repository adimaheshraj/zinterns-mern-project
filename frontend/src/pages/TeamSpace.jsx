import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Pin, MessageSquare, ThumbsUp, Heart, Flame, PartyPopper } from 'lucide-react';

const EMOJIS = ['👍', '❤️', '🔥', '🎉'];

export default function TeamSpace() {
  const { user, token, API_URL } = useApp();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [targetDept, setTargetDept] = useState('All');
  const [departments, setDepartments] = useState([]);
  const [postType, setPostType] = useState('announcement');
  const [statusMessage, setStatusMessage] = useState(null);

  // Comment input state for each post
  const [commentInputs, setCommentInputs] = useState({});

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPosts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/org/directory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const names = [...new Set(data.map((member) => member.department).filter(Boolean))].sort();
        setDepartments(names);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchDepartments();
  }, [token, API_URL]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    try {
      const res = await fetch(`${API_URL}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          targetDept,
          type: postType
        })
      });
      if (res.ok) {
        setStatusMessage('🟢 Post published successfully!');
        setNewTitle('');
        setNewContent('');
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReact = async (postId, emoji) => {
    try {
      const res = await fetch(`${API_URL}/announcements/${postId}/react`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ emoji })
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      const res = await fetch(`${API_URL}/announcements/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: commentText })
      });
      if (res.ok) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-indigo-500" />
          Team Space & Announcements
        </h1>
        <p className="text-sm text-slate-400 mt-1">Discuss tasks, align on deadlines, and share updates.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto pb-6">
        {/* Left: Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          {posts.map((post) => (
            <div
              key={post._id}
              className="p-6 rounded-2xl glass-card border shadow-sm space-y-4 bg-white dark:bg-slate-900/60"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-md font-bold uppercase mr-2">
                    {post.type}
                  </span>
                  <span className="text-xs text-slate-400">Target: {post.department}</span>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{post.title}</h3>
                </div>
                {post.pinned && <Pin className="w-4 h-4 text-indigo-500 fill-current" />}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{post.content}</p>

              <div className="text-[10px] text-slate-400">
                Posted by <span className="font-bold text-slate-500">{post.postedBy}</span> on{' '}
                {new Date(post.createdAt).toLocaleString()}
              </div>

              {/* Reactions row */}
              <div className="flex items-center gap-3 pt-2 border-t dark:border-slate-800/50">
                <div className="flex gap-1.5">
                  {EMOJIS.map((emoji) => {
                    const reaction = post.reactions?.find((r) => r.emoji === emoji);
                    const userReacted = reaction?.users?.includes(user.name);
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReact(post._id, emoji)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-colors ${
                          userReacted
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900'
                            : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{emoji}</span>
                        {reaction?.users?.length > 0 && <span>{reaction.users.length}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comments block */}
              <div className="space-y-3 pt-2 border-t dark:border-slate-800/50">
                <h5 className="text-xs font-bold text-slate-400">Thread Replies</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {post.comments?.map((c, i) => (
                    <div key={i} className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-500 mb-1">
                        <span>{c.sender}</span>
                        <span>{new Date(c.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{c.text}</p>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => handleAddComment(e, post._id)}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={commentInputs[post._id] || ''}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))
                    }
                    placeholder="Write a reply..."
                    className="flex-1 p-2 border rounded-xl bg-transparent text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                  >
                    Reply
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Write Post (HR/Manager/Mentor only) */}
        <div className="lg:col-span-1">
          {user.role !== 'Intern' ? (
            <div className="p-6 rounded-2xl glass-card border shadow-sm space-y-4 bg-white dark:bg-slate-900/60 h-fit">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Broadcast Announcement</h3>
              <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Post Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Mid-term review details"
                    className="w-full p-2 border rounded-lg bg-transparent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Target Audience</label>
                  <select
                    value={targetDept}
                    onChange={(e) => setTargetDept(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-transparent"
                  >
                    <option value="All">All Departments</option>
                    {departments.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Post Type</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-transparent"
                  >
                    <option value="announcement">Announcement Pin</option>
                    <option value="discussion">Discussion Topic</option>
                    <option value="mentor_post">Mentor Update</option>
                    <option value="hr_post">HR Guideline</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase">Message Content</label>
                  <textarea
                    required
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Compose announcement body..."
                    className="w-full p-2 border rounded-lg bg-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow hover:bg-indigo-700 text-xs"
                >
                  Publish to Feed
                </button>

                {statusMessage && (
                  <p className="text-center text-[10px] font-semibold text-slate-500 mt-2">
                    {statusMessage}
                  </p>
                )}
              </form>
            </div>
          ) : (
            <div className="p-6 rounded-2xl glass-card border shadow-sm bg-indigo-50/10 border-indigo-200/20 text-xs leading-relaxed space-y-2">
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">Communication Space</h4>
              <p className="text-slate-500">
                This is your department discussion space. You can comment on updates, ask clarifications,
                and react with emojis.
              </p>
              <p className="text-slate-400">
                To create a new broadcast announcement, contact your team lead or administrator.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

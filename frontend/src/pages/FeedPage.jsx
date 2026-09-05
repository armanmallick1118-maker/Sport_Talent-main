import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const TYPE_CONFIG = {
  news:         { label: 'News',         emoji: '📰', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  shorts:       { label: 'Shorts',       emoji: '🎬', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  achievement:  { label: 'Achievement',  emoji: '🏆', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  announcement: { label: 'Announcement', emoji: '📢', color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function PostCard({ post }) {
  const cfg = TYPE_CONFIG[post.type?.toLowerCase()] || TYPE_CONFIG.news;
  const isNewsBot = post.authorId === 'system-news-bot';
  const navigate = useNavigate();
  const goToDetail = () => navigate(`/feed/${post.id}`);

  // Big photo card layout for auto-news with images
  if (isNewsBot && post.mediaUrl) {
    return (
      <div
        onClick={goToDetail}
        className="bg-white border border-blue-100 rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden ring-1 ring-blue-100 col-span-1 sm:col-span-2 cursor-pointer group"
      >
        <div className="relative w-full h-52 sm:h-64 overflow-hidden">
          <img
            src={post.mediaUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.target.style.display = 'none'; }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {/* Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-600 text-white rounded-full px-2.5 py-0.5 shadow">
              📰 News
            </span>
          </div>
          {/* Time */}
          <span className="absolute top-3 right-3 text-[11px] text-white/80 bg-black/30 rounded-full px-2 py-0.5 backdrop-blur-sm">
            {timeAgo(post.created_at)}
          </span>
          {/* Title over image */}
          <h3 className="absolute bottom-3 left-3 right-3 font-bold text-white text-base sm:text-lg leading-snug drop-shadow-md">
            {post.title}
          </h3>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 flex-1">{post.content}</p>
          <span className="ml-3 shrink-0 text-blue-600 text-xs font-semibold group-hover:underline">Read more →</span>
        </div>
      </div>
    );
  }

  // Standard card for user posts
  return (
    <div
      onClick={goToDetail}
      className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer group ${isNewsBot ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'}`}
    >
      {post.mediaUrl && (
        <div className="w-full h-44 bg-slate-100 overflow-hidden">
          {post.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
            <video src={post.mediaUrl} className="w-full h-full object-cover" controls muted />
          ) : (
            <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { e.target.style.display = 'none'; }} />
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold border rounded-full px-2.5 py-0.5 ${cfg.color}`}>
              {cfg.emoji} {cfg.label}
            </span>
            {isNewsBot && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold border border-indigo-200 bg-indigo-50 text-indigo-600 rounded-full px-2 py-0.5">
                🤖 Daily Auto-News
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
        </div>
        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
        <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{post.content}</p>
        <p className="mt-2 text-xs font-semibold text-blue-600 group-hover:underline">Read more →</p>
      </div>
    </div>
  );
}

function CreatePost({ onPosted }) {
  const [form, setForm]       = useState({ type: 'news', title: '', content: '', mediaUrl: '', external_url: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { setError('Title and content are required.'); return; }
    setLoading(true); setError('');
    try {
      await API.post('/api/v1/feed', {
        type: form.type, title: form.title.trim(),
        content: form.content.trim(), mediaUrl: form.mediaUrl.trim() || null,
        external_url: form.external_url.trim() || null,
      });
      setForm({ type: 'news', title: '', content: '', mediaUrl: '', external_url: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      onPosted();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to post. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-6">
      <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <span className="text-xl">✍️</span> Create a Post
      </h2>
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-2.5 mb-4 font-medium">✓ Posted successfully!</div>}
      {error   && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-2.5 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <button key={key} type="button" onClick={() => setForm(f => ({ ...f, type: key }))}
              className={`flex items-center gap-1 text-xs font-semibold border rounded-full px-3 py-1.5 transition-all cursor-pointer ${
                form.type === key ? cfg.color + ' ring-2 ring-offset-1 ring-current' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}>
              {cfg.emoji} {cfg.label}
            </button>
          ))}
        </div>
        <input type="text" name="title" value={form.title} onChange={handleChange}
          placeholder="Post title…" maxLength={100} required
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors" />
        <textarea name="content" value={form.content} onChange={handleChange}
          placeholder="Share news, achievements, or short clips…" rows={3} maxLength={500} required
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
        <input type="url" name="mediaUrl" value={form.mediaUrl} onChange={handleChange}
          placeholder="🖼️  Poster / video URL (optional)"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors" />
        <input type="url" name="external_url" value={form.external_url} onChange={handleChange}
          placeholder="🔗 Official link / Registration form URL (optional)"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors" />
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2">
          {loading ? (<><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Posting…</>) : '🚀 Post Now'}
        </button>
      </form>
    </div>
  );
}

export default function FeedPage() {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/api/v1/feed?limit=50&t=${Date.now()}`);
      setPosts(data.data || []);
    } catch { setError('Could not load feed. Check your connection.'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">🏆 Sports Feed</h1>
        <p className="text-slate-500 text-sm mt-1">Share news, shorts, achievements, and announcements.</p>
      </div>
      <CreatePost onPosted={fetchPosts} />
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <span className="flex-1 h-px bg-slate-200" />Latest Posts<span className="flex-1 h-px bg-slate-200" />
        </h2>
        {loading && <div className="flex justify-center py-12"><span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 text-center">
            {error} <button onClick={fetchPosts} className="ml-2 underline font-medium">Retry</button>
          </div>
        )}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-semibold text-slate-600 mb-1">No posts yet</p>
            <p className="text-sm">Be the first to share something with the community!</p>
          </div>
        )}
        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>
    </div>
  );
}

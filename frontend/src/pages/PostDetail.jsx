import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Tag } from 'lucide-react';
import API from '../services/api';

const TYPE_CONFIG = {
  news:         { label: 'News',         emoji: '📰', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  shorts:       { label: 'Shorts',       emoji: '🎬', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  achievement:  { label: 'Achievement',  emoji: '🏆', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  announcement: { label: 'Announcement', emoji: '📢', color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff} seconds ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

function fullDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/api/v1/feed/${id}`);
        setPost(data.data);
      } catch {
        setError('This post could not be found.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Post not found</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => navigate('/feed')}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-500 transition">
          <ArrowLeft size={16} /> Back to Feed
        </button>
      </div>
    );
  }

  const cfg = TYPE_CONFIG[post.type?.toLowerCase()] || TYPE_CONFIG.news;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Feed
      </button>

      <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Hero image */}
        {post.mediaUrl && (
          <div className="relative w-full h-56 sm:h-72 overflow-hidden">
            {post.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
              <video src={post.mediaUrl} className="w-full h-full object-cover" controls />
            ) : (
              <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover" />
            )}
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        )}

        <div className="p-5 sm:p-8">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold border rounded-full px-3 py-1 ${cfg.color}`}>
              {cfg.emoji} {cfg.label}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={12} />
              {timeAgo(post.created_at)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-4">
            {post.title}
          </h1>

          {/* Divider */}
          <div className="h-px bg-slate-100 mb-5" />

          {/* Full content */}
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed text-[15px] whitespace-pre-line">
            {post.content}
          </div>

          {/* External link CTA */}
          {post.external_url && (
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-500/20">
              <div>
                <p className="text-white font-bold text-base">
                  {post.type === 'announcement' ? '🏆 Register / Apply Now' : '🔗 Visit Official Page'}
                </p>
                <p className="text-blue-100 text-xs mt-0.5 break-all">{post.external_url}</p>
              </div>
              <a
                href={post.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition shadow"
                onClick={e => e.stopPropagation()}
              >
                Open Link ↗
              </a>
            </div>
          )}

          {/* Footer meta */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Tag size={12} />
              {post.type}
            </span>
            <span>{fullDate(post.created_at)}</span>
          </div>
        </div>
      </article>
    </div>
  );
}

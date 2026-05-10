'use client';

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Heart, MessageSquare, Share2, Send } from 'lucide-react';

export default function SocialFeed() {
  const activeCoinId = useGameStore((state) => state.activeCoinId);
  const coins = useGameStore((state) => state.coins);
  const activeCoin = activeCoinId ? coins[activeCoinId] : null;
  const socialPostsMap = useGameStore((state) => state.socialPosts);
  const createPost = useGameStore((state) => state.createPost);
  const followers = useGameStore((state) => state.followers);
  const playerWallet = useGameStore((state) => state.playerWallet);

  const [postContent, setPostContent] = useState('');

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !activeCoinId || !activeCoin) return;
    createPost(activeCoinId, postContent);
    setPostContent('');
  };

  if (!activeCoin || !activeCoinId || !playerWallet) return null;

  const socialPosts = socialPostsMap[activeCoinId] || [];

  return (
    <div className="w-full lg:w-80 bg-[#181a20] border-l border-gray-800 flex flex-col shrink-0">
      {/* Profile Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-b from-[#fcd535]/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#fcd535] text-black font-bold flex items-center justify-center text-xl">
            {activeCoin.symbol[0]}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white leading-tight">Official {activeCoin.symbol}</span>
            <span className="text-gray-400 text-xs">@{playerWallet.username}</span>
          </div>
        </div>
        <div className="mt-3 flex gap-4 text-sm">
          <div>
            <span className="font-bold text-white">{followers.toLocaleString()}</span> <span className="text-gray-400">Followers</span>
          </div>
        </div>
      </div>

      {/* Post Composer */}
      <div className="p-3 border-b border-gray-800">
        <form onSubmit={handlePost} className="flex gap-2">
          <input
            type="text"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="Shill your coin..."
            className="flex-1 bg-[#0b0e11] border border-gray-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-[#fcd535]"
            maxLength={100}
          />
          <button
            type="submit"
            disabled={!postContent.trim()}
            className="bg-[#fcd535] text-black p-2 rounded-full hover:bg-[#fcd535]/90 disabled:opacity-50 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-0">
        {socialPosts.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No posts yet. Start shilling to attract followers and pump your coin!
          </div>
        ) : (
          socialPosts.map((post) => (
            <div key={post.id} className="p-4 border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fcd535] shrink-0 flex items-center justify-center text-black font-bold">
                  {activeCoin.symbol[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1 text-sm">
                    <span className="font-bold text-white">
                        {post.isKol ? 'Crypto Influencer 🐳' : `Official ${activeCoin.symbol}`}
                    </span>
                    <span className="text-gray-500 text-xs">· Just now</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">{post.content}</p>

                  <div className="flex items-center gap-6 mt-3 text-gray-500 text-xs mb-3">
                    <div className="flex items-center gap-1 hover:text-[#fcd535] cursor-pointer transition-colors">
                      <Heart size={14} className={post.likes > 0 ? "fill-[#f6465d] text-[#f6465d]" : ""} />
                      <span className={post.likes > 0 ? "text-[#f6465d]" : ""}>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-[#fcd535] cursor-pointer transition-colors">
                      <MessageSquare size={14} />
                      <span>{post.comments?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-[#fcd535] cursor-pointer transition-colors">
                      <Share2 size={14} />
                    </div>
                  </div>

                  {/* Render Bot Comments */}
                  {post.comments && post.comments.length > 0 && (
                      <div className="bg-[#0b0e11] rounded-lg p-2 flex flex-col gap-2 border border-gray-800/50">
                          {post.comments.map((comment, idx) => (
                              <div key={idx} className="flex gap-2">
                                  <div className="w-5 h-5 rounded-full bg-gray-800 shrink-0 flex items-center justify-center text-[10px]">🤖</div>
                                  <div className="text-xs text-gray-400">
                                      <span className="font-bold text-gray-300 mr-1">Bot_{Math.floor(Math.random() * 900) + 100}</span>
                                      {comment}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

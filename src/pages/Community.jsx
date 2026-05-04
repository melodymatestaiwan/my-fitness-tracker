import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Trophy, Dumbbell, Utensils, Clock, Camera, Castle, Plus, Flame } from 'lucide-react';
import { GlassCard } from '../components';
import { formatDate } from '../constants';

// 模擬社群成員（未來接後端後替換為真實用戶）
const MOCK_USERS = [
  { id: 'u1', name: '小明', avatar: '💪', level: 12 },
  { id: 'u2', name: 'Emily', avatar: '🏃‍♀️', level: 8 },
  { id: 'u3', name: '阿翔', avatar: '🏋️', level: 15 },
  { id: 'u4', name: 'Yuki', avatar: '🧘‍♀️', level: 6 },
];

const POST_ICONS = {
  workout: { icon: Dumbbell, color: '#FF5733', label: '完成訓練' },
  diet: { icon: Utensils, color: '#2ECC71', label: '飲食紀錄' },
  fasting: { icon: Clock, color: '#3498DB', label: '斷食達標' },
  photo: { icon: Camera, color: '#E91E63', label: '身材紀錄' },
  building: { icon: Castle, color: '#FFD700', label: '建築升級' },
  streak: { icon: Flame, color: '#FF5733', label: '連續挑戰' },
  milestone: { icon: Trophy, color: '#FFD700', label: '里程碑' },
};

// 生成模擬動態
function generateMockFeed(records, workouts, diet, fasting, building) {
  const feed = [];
  const today = formatDate(new Date());

  // 用戶自己的活動
  if (records.length > 0) {
    const latest = records[records.length - 1];
    feed.push({
      id: 'my-weight-' + latest.date,
      userId: 'me', user: { name: '你', avatar: '🔥' },
      type: 'milestone', time: latest.date,
      content: `記錄了體重 ${latest.weight}kg`,
      likes: 0, comments: [], liked: false,
    });
  }

  if (workouts[today]?.length > 0) {
    const totalSets = workouts[today].reduce((s, ex) => s + ex.sets.filter(st => st.completed).length, 0);
    if (totalSets > 0) {
      feed.push({
        id: 'my-workout-' + today,
        userId: 'me', user: { name: '你', avatar: '🔥' },
        type: 'workout', time: today,
        content: `完成了 ${workouts[today].length} 個動作、${totalSets} 組訓練`,
        likes: 0, comments: [], liked: false,
      });
    }
  }

  const todayDiet = diet.filter(d => d.date === today);
  if (todayDiet.length > 0) {
    const kcal = todayDiet.reduce((s, d) => s + (d.kcal || 0) * (d.servings || 1), 0);
    feed.push({
      id: 'my-diet-' + today,
      userId: 'me', user: { name: '你', avatar: '🔥' },
      type: 'diet', time: today,
      content: `今日已攝取 ${Math.round(kcal)} kcal（${todayDiet.length} 項食物）`,
      likes: 0, comments: [], liked: false,
    });
  }

  if (building.streak > 0) {
    feed.push({
      id: 'my-streak',
      userId: 'me', user: { name: '你', avatar: '🔥' },
      type: 'streak', time: today,
      content: `連續訓練 ${building.streak} 天 🔥`,
      likes: 0, comments: [], liked: false,
    });
  }

  const placedCount = Object.keys(building.placed || {}).length;
  if (placedCount > 0) {
    feed.push({
      id: 'my-building',
      userId: 'me', user: { name: '你', avatar: '🔥' },
      type: 'building', time: today,
      content: `建築進度：已放置 ${placedCount} 個建材`,
      likes: 0, comments: [], liked: false,
    });
  }

  // 模擬其他用戶動態
  const mockPosts = [
    { userId: 'u1', user: MOCK_USERS[0], type: 'workout', time: today, content: '今天練胸日，啞鈴臥推 3 組 x 12 次，感覺超棒！', likes: 12, comments: [{ user: 'Emily', text: '好猛！💪' }], liked: false },
    { userId: 'u2', user: MOCK_USERS[1], type: 'streak', time: today, content: '連續 21 天打卡！三週達成 🎉', likes: 24, comments: [{ user: '阿翔', text: '太強了！' }, { user: 'Yuki', text: '向你看齊！' }], liked: false },
    { userId: 'u3', user: MOCK_USERS[2], type: 'milestone', time: today, content: '體重突破 75kg 大關！從 90kg 到現在，減了 15kg 💪', likes: 56, comments: [{ user: '小明', text: '超勵志！' }], liked: false },
    { userId: 'u4', user: MOCK_USERS[3], type: 'fasting', time: today, content: '18:6 斷食完成，堅持了 19 小時！', likes: 8, comments: [], liked: false },
    { userId: 'u1', user: MOCK_USERS[0], type: 'building', time: today, content: '宮殿二樓完工！用了大理石牆壁 🏛️', likes: 15, comments: [{ user: 'Yuki', text: '好漂亮！' }], liked: false },
    { userId: 'u2', user: MOCK_USERS[1], type: 'photo', time: today, content: '第 30 天身材對比，開始看到腹肌線條了！', likes: 42, comments: [{ user: '阿翔', text: '進步超明顯！' }, { user: '小明', text: '求飲食菜單' }], liked: false },
  ];

  mockPosts.forEach((p, i) => feed.push({ ...p, id: `mock-${i}` }));

  // 按時間排序（模擬混合）
  return feed.sort(() => Math.random() - 0.5);
}

export default function Community({ records, workouts, diet, fasting, building, communityPosts, setCommunityPosts }) {
  const [activeView, setActiveView] = useState('feed'); // 'feed' | 'create'
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState('milestone');

  const feed = [
    ...(communityPosts || []),
    ...generateMockFeed(records, workouts, diet, fasting, building),
  ].filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i); // 去重

  const [commentingPost, setCommentingPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [expandedComments, setExpandedComments] = useState({});

  const toggleLike = (postId) => {
    // 對用戶自己的貼文操作 communityPosts
    const idx = (communityPosts || []).findIndex(p => p.id === postId);
    if (idx > -1) {
      const updated = [...communityPosts];
      updated[idx] = { ...updated[idx], liked: !updated[idx].liked, likes: updated[idx].liked ? updated[idx].likes - 1 : updated[idx].likes + 1 };
      setCommunityPosts(updated);
    }
  };

  const addComment = (postId) => {
    if (!commentText.trim()) return;
    const idx = (communityPosts || []).findIndex(p => p.id === postId);
    if (idx > -1) {
      const updated = [...communityPosts];
      const newComments = [...(updated[idx].comments || []), { user: '你', text: commentText.trim() }];
      updated[idx] = { ...updated[idx], comments: newComments };
      setCommunityPosts(updated);
    }
    setCommentText('');
    setCommentingPost(null);
  };

  const sharePost = (post) => {
    const text = `${post.user.name}: ${post.content}`;
    if (navigator.share) {
      navigator.share({ title: 'Elite Fitness', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert('已複製到剪貼簿！'));
    }
  };

  const createPost = () => {
    if (!newPostContent.trim()) return;
    const post = {
      id: 'my-post-' + Date.now(),
      userId: 'me',
      user: { name: '你', avatar: '🔥' },
      type: newPostType,
      time: formatDate(new Date()),
      content: newPostContent.trim(),
      likes: 0,
      comments: [],
      liked: false,
    };
    setCommunityPosts([post, ...(communityPosts || [])]);
    setNewPostContent('');
    setActiveView('feed');
  };

  // --- Feed ---
  const renderFeed = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-4">
        <p className="text-white/40 font-black tracking-[0.5em] text-[10px] uppercase mb-2">Elite Community</p>
        <h1 className="text-5xl font-black text-white italic tracking-tighter leading-none uppercase">Squad<br/><span className="text-[#FF5733]">Feed</span></h1>
      </div>

      {/* Create Post Button */}
      <button
        onClick={() => setActiveView('create')}
        className="w-full bg-[#FF5733]/10 border border-[#FF5733]/30 rounded-2xl p-4 flex items-center gap-3 hover:bg-[#FF5733]/20 transition-all"
      >
        <div className="w-10 h-10 bg-[#FF5733]/20 rounded-full flex items-center justify-center text-lg">🔥</div>
        <span className="text-white/30 text-sm font-bold italic">分享你的訓練成果...</span>
        <Plus size={18} className="text-[#FF5733] ml-auto" />
      </button>

      {/* Posts */}
      {feed.map(post => {
        const typeInfo = POST_ICONS[post.type] || POST_ICONS.milestone;
        const TypeIcon = typeInfo.icon;
        return (
          <GlassCard key={post.id} className="p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-lg border border-white/10">
                {post.user.avatar}
              </div>
              <div className="flex-1">
                <p className="text-white font-black text-sm italic">{post.user.name}</p>
                <div className="flex items-center gap-2">
                  <TypeIcon size={10} style={{ color: typeInfo.color }} />
                  <span className="text-[10px] font-bold" style={{ color: typeInfo.color }}>{typeInfo.label}</span>
                  <span className="text-white/20 text-[10px]">· {post.time}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <p className="text-white/80 text-sm leading-relaxed mb-4">{post.content}</p>

            {/* Actions */}
            <div className="flex items-center gap-6 pt-3 border-t border-white/5">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-all ${post.liked ? 'text-red-400' : 'text-white/30 hover:text-red-400'}`}
              >
                <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} />
                {post.likes > 0 && <span>{post.likes}</span>}
              </button>
              <button
                onClick={() => setCommentingPost(commentingPost === post.id ? null : post.id)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-all ${commentingPost === post.id ? 'text-[#3498DB]' : 'text-white/30 hover:text-[#3498DB]'}`}
              >
                <MessageCircle size={16} />
                {post.comments?.length > 0 && <span>{post.comments.length}</span>}
              </button>
              <button
                onClick={() => sharePost(post)}
                className="flex items-center gap-1.5 text-xs font-bold text-white/30 hover:text-[#2ECC71] transition-all ml-auto"
              >
                <Send size={16} />
              </button>
            </div>

            {/* Comment Input */}
            {commentingPost === post.id && (
              <div className="mt-3 pt-3 border-t border-white/5 flex gap-2 animate-slide-bottom">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addComment(post.id); }}
                  placeholder="寫留言..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#3498DB]/50"
                  autoFocus
                />
                <button onClick={() => addComment(post.id)} className="bg-[#3498DB] text-white px-3 py-2 rounded-xl text-[10px] font-black">送出</button>
              </div>
            )}

            {/* Comments */}
            {post.comments?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                {(expandedComments[post.id] ? post.comments : post.comments.slice(0, 2)).map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-white font-black text-[10px] italic flex-shrink-0">{c.user}</span>
                    <span className="text-white/40 text-[10px]">{c.text}</span>
                  </div>
                ))}
                {post.comments.length > 2 && !expandedComments[post.id] && (
                  <button onClick={() => setExpandedComments({ ...expandedComments, [post.id]: true })} className="text-[10px] text-[#3498DB] font-bold">查看全部 {post.comments.length} 則留言</button>
                )}
              </div>
            )}
          </GlassCard>
        );
      })}

      {feed.length === 0 && (
        <p className="text-white/20 text-center py-12">還沒有動態，開始訓練並分享吧！</p>
      )}
    </div>
  );

  // --- Create Post ---
  const renderCreate = () => (
    <div className="space-y-6 animate-slide-bottom">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white italic uppercase">發佈動態</h2>
        <button onClick={() => setActiveView('feed')} className="text-white/30 text-xs font-black uppercase">取消</button>
      </div>

      <GlassCard>
        {/* Post Type */}
        <div className="mb-4">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">類型</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(POST_ICONS).map(([key, info]) => {
              const Icon = info.icon;
              return (
                <button
                  key={key}
                  onClick={() => setNewPostType(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black transition-all border ${
                    newPostType === key
                      ? 'border-[#FF5733] bg-[#FF5733]/10 text-white'
                      : 'border-white/10 text-white/30 hover:border-white/20'
                  }`}
                >
                  <Icon size={12} />
                  {info.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <textarea
          value={newPostContent}
          onChange={e => setNewPostContent(e.target.value)}
          placeholder="分享你的訓練心得、成果或日常..."
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#FF5733]/50 transition-colors placeholder:text-white/20 resize-none"
        />

        <button
          onClick={createPost}
          disabled={!newPostContent.trim()}
          className="w-full mt-4 bg-[#FF5733] text-white font-black py-4 rounded-[2rem] shadow-xl shadow-[#FF5733]/20 uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Send size={18} /> 發佈
        </button>
      </GlassCard>
    </div>
  );

  return (
    <div className="pb-12">
      {activeView === 'feed' && renderFeed()}
      {activeView === 'create' && renderCreate()}
    </div>
  );
}

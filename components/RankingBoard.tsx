import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../types';
import { getRankings } from '../services/storage';
import { Trophy, Calendar, Clock, Image as ImageIcon } from 'lucide-react';

const RankingBoard: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [rankings, setRankings] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const data = getRankings(period);
    setRankings(data);
  }, [period]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-400" fill="currentColor" />;
      case 1: return <Trophy className="w-6 h-6 text-gray-300" fill="currentColor" />;
      case 2: return <Trophy className="w-6 h-6 text-amber-600" fill="currentColor" />;
      default: return <span className="text-xl font-bold text-neutral-500">#{index + 1}</span>;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent inline-flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Photo Stylist Ranking
        </h2>
        <p className="text-neutral-400 text-sm">過去の審査結果ランキング（ブラウザ保存）</p>
      </div>

      {/* Period Toggles */}
      <div className="flex justify-center">
        <div className="bg-[#18181b] p-1 rounded-xl flex gap-1 border border-white/5">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                period === p 
                  ? 'bg-neutral-800 text-white shadow-lg' 
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {p === 'day' ? 'Daily' : p === 'week' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {rankings.length === 0 ? (
          <div className="text-center py-20 bg-[#111115] rounded-3xl border border-white/5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-800/50 mb-4">
              <ImageIcon className="w-8 h-8 text-neutral-600" />
            </div>
            <p className="text-neutral-400 font-medium">ランキングデータがまだありません</p>
            <p className="text-neutral-600 text-sm mt-2">写真を審査するとここに表示されます</p>
          </div>
        ) : (
          rankings.map((item, index) => (
            <div 
              key={item.id}
              className="bg-[#111115] border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:bg-[#18181b] transition-colors group"
            >
              {/* Rank */}
              <div className="w-12 flex justify-center flex-shrink-0">
                {getRankIcon(index)}
              </div>

              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-black border border-white/10 flex-shrink-0 relative">
                 <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-lg"></div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold truncate pr-4">{item.title || 'Untitled'}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.timestamp)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-neutral-400 line-clamp-1">
                  {item.summary}
                </div>
              </div>

              {/* Score */}
              <div className="flex-shrink-0 text-right px-4">
                <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
                  {item.totalScore}
                </div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Points</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RankingBoard;
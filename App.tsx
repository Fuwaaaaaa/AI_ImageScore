import React, { useState, useRef } from 'react';
import { Upload, RefreshCw, AlertCircle, X, Twitter, Sparkles, User, MapPin, Gem, LayoutList, Home, Share2 } from 'lucide-react';
import { analyzeImage } from './services/gemini';
import { saveAnalysisResult } from './services/storage';
import { AnalysisResult } from './types';
import ScoreGauge from './components/ScoreGauge';
import CriteriaChart from './components/RadarChart';
import RankingBoard from './components/RankingBoard';

// Helper function to compress/resize images
const compressImage = (file: File, maxSize: number = 1536, quality: number = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
             reject(new Error("Could not get canvas context"));
             return;
        }
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'ranking'>('home');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルのみアップロード可能です。');
      return;
    }
    
    setError(null);
    setResult(null);
    setImage(null);
    setView('home'); // Ensure we are on home view
    
    try {
      const compressedDataUrl = await compressImage(file);
      setImage(compressedDataUrl);
    } catch (err) {
      console.error("Image processing error:", err);
      setError('画像の読み込みに失敗しました。');
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const data = await analyzeImage(image);
      setResult(data);

      // Create a thumbnail and save to history
      createThumbnailAndSave(image, data);

    } catch (err: any) {
      console.error(err);
      let errorMessage = '画像の解析中にエラーが発生しました。もう一度お試しください。';
      
      // Check for specific error messages
      if (err.message && (err.message.includes('403') || err.message.includes('Forbidden') || err.message.includes('PERMISSION_DENIED'))) {
        errorMessage = 'APIキーのエラーです (403 Forbidden)。APIキーが無効か、Google Cloudの設定でAPIが有効になっていない可能性があります。';
      } else if (err.message) {
        errorMessage = `エラーが発生しました: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createThumbnailAndSave = (fullImage: string, data: AnalysisResult) => {
    const img = new Image();
    img.src = fullImage;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_THUMB_SIZE = 150;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
             height *= MAX_THUMB_SIZE / width;
             width = MAX_THUMB_SIZE;
        } else {
             width *= MAX_THUMB_SIZE / height;
             height = MAX_THUMB_SIZE;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if(ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const thumbBase64 = canvas.toDataURL('image/jpeg', 0.7);
            saveAnalysisResult(data, thumbBase64);
        }
    };
  };

  const handleShare = async () => {
    if (!result || !image) return;

    // --- 1. テキスト生成 (100文字制限) ---
    // フォーマット:
    // 🏆VRChat審査: {score}点
    // 「{title}」
    // {summary}
    // #VRChat
    
    const scoreStr = `🏆VRChat審査: ${result.totalScore}点`;
    const hashTag = "#VRChat";
    
    // タイトルを長すぎる場合は省略 (最大10文字程度)
    let titleStr = result.title;
    if (titleStr.length > 10) titleStr = titleStr.substring(0, 9) + "…";
    const titleLine = `「${titleStr}」`;

    // 固定部分の文字数を計算 (改行3つ分を含む)
    const fixedLength = scoreStr.length + titleLine.length + hashTag.length + 3;
    const maxSummaryLength = 100 - fixedLength;

    // サマリーを制限内に収める
    let summaryStr = result.summary.replace(/\r?\n/g, ' '); // 改行を除去
    if (summaryStr.length > maxSummaryLength) {
        summaryStr = summaryStr.substring(0, maxSummaryLength - 1) + "…";
    }

    const shareText = `${scoreStr}\n${titleLine}\n${summaryStr}\n${hashTag}`;

    // --- 2. 画像添付とシェア ---
    
    // 画像データをFileオブジェクトに変換
    let file: File | null = null;
    try {
        const arr = image.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        file = new File([u8arr], "vrchat-analysis.jpg", { type: mime });
    } catch (e) {
        console.error("Image conversion failed", e);
    }

    // Web Share API (モバイル等) で画像付きシェアを試みる
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                text: shareText,
                files: [file]
            });
            return; // 成功したら終了
        } catch (err) {
            // キャンセルされた場合は何もしない、エラーならログ
            if ((err as Error).name !== 'AbortError') {
                console.log("Web Share API failed, falling back to Intent");
            } else {
                return;
            }
        }
    }

    // フォールバック: Twitter Intent (画像添付不可、テキストのみ)
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-neutral-100 selection:bg-cyan-500 selection:text-white pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] opacity-50"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-600/20 rounded-full blur-[100px] opacity-30"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-[#050508]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setView('home')}
          >
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent hidden md:block">
              VRC Photo Stylist
            </span>
            <span className="font-bold text-lg tracking-tight text-white md:hidden">
              VRC Stylist
            </span>
          </div>
          
          <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
             <button 
                onClick={() => setView('home')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${view === 'home' ? 'bg-neutral-800 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
             >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
             </button>
             <button 
                onClick={() => setView('ranking')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${view === 'ranking' ? 'bg-neutral-800 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
             >
                <LayoutList className="w-4 h-4" />
                <span className="hidden sm:inline">Ranking</span>
             </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        
        {view === 'ranking' ? (
            <RankingBoard />
        ) : (
            <>
                {/* Hero / Intro (Only show if no image selected) */}
                {!image && (
                <div className="text-center py-20 animate-fade-in-up">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
                    VRChatの<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">一瞬</span>を、<br className="mt-2" />
                    最高の<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">一枚</span>に。
                    </h1>
                    <p className="text-neutral-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                    プロカメラマンとスタイリストAIが、あなたのスクショを審査。<br />
                    アバターのメイク・衣装、立ち位置、ワールドとの調和まで徹底分析します。
                    </p>
                    
                    <div className="flex justify-center">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative px-8 py-4 bg-white text-neutral-950 font-bold rounded-full text-lg shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all active:scale-95 flex items-center gap-3 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        写真をアップロード
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                    </div>
                </div>
                )}

                <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                />

                {/* Main Content Area */}
                {image && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    
                    {/* Left Column: Image Preview */}
                    <div className="space-y-6">
                    <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                        <img 
                        src={image} 
                        alt="Preview" 
                        className="w-full h-auto object-contain max-h-[80vh]" 
                        />
                        
                        {!loading && !result && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                                onClick={reset}
                                className="bg-red-500/80 hover:bg-red-500 text-white p-3 rounded-full backdrop-blur-sm transition-transform hover:scale-110"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {!loading && !result && (
                        <div className="flex gap-4">
                        <button
                            onClick={handleAnalyze}
                            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            審査・診断を開始
                        </button>
                        <button
                            onClick={reset}
                            className="px-6 py-4 rounded-xl border border-white/10 hover:bg-white/5 text-neutral-300 font-medium transition-colors"
                        >
                            キャンセル
                        </button>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        {error}
                        </div>
                    )}
                    </div>

                    {/* Right Column: Results or Loading */}
                    <div className="relative min-h-[400px]">
                    
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050508]/60 backdrop-blur-md rounded-3xl border border-white/5 z-20">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                            </div>
                        </div>
                        <p className="mt-8 text-xl font-medium text-cyan-200 animate-pulse">
                            Analyzing VRChat World...
                        </p>
                        <p className="mt-2 text-sm text-neutral-500">ライティング・メイク・衣装をチェック中</p>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6 animate-fade-in pb-20">
                        {/* Header Result */}
                        <div className="bg-[#111115] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent opacity-50"></div>
                            
                            <div className="absolute top-4 right-4 z-20">
                                <button 
                                    onClick={handleShare} 
                                    className="p-2 bg-white/5 hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2] rounded-full text-neutral-400 transition-colors border border-white/5" 
                                    title="X(Twitter)で結果と画像をシェア"
                                >
                                    <Twitter className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-shrink-0">
                                <ScoreGauge score={result.totalScore} />
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold tracking-wider uppercase mb-2">
                                    VRC Stylist Report
                                </div>
                                <h2 className="text-3xl font-bold text-white leading-tight">{result.title}</h2>
                                <p className="text-neutral-400 leading-relaxed text-sm">{result.summary}</p>
                            </div>
                            </div>
                        </div>

                        {/* Criteria Radar */}
                        <div className="bg-[#111115] border border-white/5 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-purple-500" />
                            Evaluation Parameter
                            </h3>
                            <CriteriaChart data={result.criteria} />
                        </div>

                        {/* Avatar & Makeup Advice */}
                        <div className="bg-gradient-to-br from-purple-900/20 to-[#111115] border border-purple-500/20 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <User className="w-32 h-32" />
                            </div>
                            <h3 className="text-xl font-bold mb-4 text-purple-300 flex items-center gap-2 relative z-10">
                            <User className="w-5 h-5" />
                            アバター・メイク診断
                            </h3>
                            <p className="text-neutral-300 leading-relaxed whitespace-pre-line relative z-10">
                            {result.avatarCritique}
                            </p>
                        </div>

                        {/* Positioning Advice */}
                        <div className="bg-[#111115] border border-white/5 rounded-3xl p-8">
                            <h3 className="text-xl font-bold mb-4 text-cyan-300 flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            立ち位置・ポージング提案
                            </h3>
                            <p className="text-neutral-300 leading-relaxed whitespace-pre-line">
                            {result.posingAdvice}
                            </p>
                        </div>

                        {/* Recommended Accessories */}
                        <div className="bg-[#111115] border border-white/5 rounded-3xl p-8">
                            <h3 className="text-xl font-bold mb-6 text-pink-300 flex items-center gap-2">
                            <Gem className="w-5 h-5" />
                            おすすめアクセサリー
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {result.accessoryRecommendations.map((item, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                                        <span className="text-pink-300 font-bold text-sm">{idx + 1}</span>
                                    </div>
                                    <span className="text-neutral-200 font-medium">{item}</span>
                                </div>
                                ))}
                            </div>
                        </div>

                        {/* General Advice */}
                        <div className="bg-[#111115] border border-white/5 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">
                                General Photography Advice
                            </h3>
                            <p className="text-neutral-300 leading-relaxed whitespace-pre-line">
                                {result.advice}
                            </p>
                        </div>

                        {/* Technical Guess */}
                        {result.technicalDetails && (
                            <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 text-sm">
                                <h4 className="text-neutral-500 font-bold uppercase tracking-wider mb-2 text-xs">Technical / World Settings</h4>
                                <p className="text-neutral-300 font-mono">{result.technicalDetails}</p>
                            </div>
                        )}
                        
                        <div className="flex flex-col gap-3 pt-4">
                            <button 
                                onClick={handleShare}
                                className="w-full py-4 rounded-xl bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-98 flex items-center justify-center gap-2"
                            >
                                <Twitter className="w-5 h-5" />
                                診断結果をシェア (X等)
                            </button>

                            <button 
                                onClick={reset}
                                className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 text-neutral-400 font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                他の写真を診断する
                            </button>
                        </div>

                        </div>
                    )}
                    </div>
                </div>
                )}
            </>
        )}
      </main>
      
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
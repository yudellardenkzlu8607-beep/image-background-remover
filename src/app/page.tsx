'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [credits, setCredits] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setSession(data);
        setStatus(data ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => setStatus('unauthenticated'));
    
    // 获取用户积分信息
    fetch('/api/user/info')
      .then(res => res.json())
      .then(data => {
        if (data.credits) {
          setCredits(data.credits.balance);
        }
      })
      .catch(console.error);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleRemoveBg = async () => {
    if (!selectedImage) return;
    
    setProcessing(true);
    setProgress(0);
    setError(null);
    
    // Animation effect
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    
    const formData = new FormData();
    formData.append('image', selectedImage);
    
    try {
      const res = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (data.error) {
        if (data.error === 'no_credits' || data.error === 'daily_limit_reached') {
          // 积分不足或达到限制
          setUpgradeMessage(data.message || '积分不足');
          setShowUpgradeModal(true);
          setError(null);
        } else {
          setError(data.error || '处理图片时出错');
        }
      } else {
        setResult(data.result);
        // 更新余额
        if (data.remainingCredits !== undefined) {
          setCredits(data.remainingCredits);
        }
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError('处理图片时出错');
    } finally {
      setTimeout(() => {
        setProcessing(false);
        setProgress(0);
      }, 500);
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    window.location.href = '/';
  };

  const handleClear = () => {
    setSelectedImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="animate-pulse text-gray-500">加载中...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {/* Header */}
      <div className="w-full flex justify-between items-center py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Powered by AI</span>
        </div>
        {session ? (
          <div className="flex items-center gap-4">
            {/* 积分显示 */}
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full">
              <span className="text-amber-600">⭐</span>
              <span className="text-sm font-medium text-amber-700">{credits} 积分</span>
            </div>
            {session.user?.image && (
              <img src={session.user.image} alt={session.user.name} className="w-8 h-8 rounded-full" />
            )}
            <span className="text-sm text-gray-700">{session.user?.name}</span>
            <a 
              href="/profile"
              className="px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              个人中心
            </a>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
            >
              退出
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a
              href="/api/auth/signin/google"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              登录
            </a>
            <a
              href="/pricing"
              className="px-3 py-1 text-sm rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
            >
              定价
            </a>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex place-items-center">
        <h1 className="text-4xl font-bold text-center">
          AI Image Background Remover
        </h1>
      </div>

      {/* Upload and Process Area */}
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6">上传图片去除背景</h2>
          
          {/* Return button when there's an image */}
          {selectedImage && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回上传
            </button>
          )}
          
          {!selectedImage ? (
            <div 
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600">点击选择图片或拖拽到此处</p>
              <p className="text-sm text-gray-400 mt-2">支持 JPG、PNG 格式</p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Processing Animation */}
              {processing && (
                <div className="relative h-64 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={preview!} 
                    alt="Processing" 
                    className="absolute inset-0 w-full h-full object-contain blur-sm"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-white text-lg font-medium">AI 正在去除背景...</p>
                      <p className="text-white/70 text-sm mt-2">{Math.round(progress)}%</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Result with comparison */}
              {result && !processing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">处理完成！</span>
                    <button
                      onClick={() => setResult(null)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      重新处理
                    </button>
                  </div>
                  
                  {/* Comparison */}
                  <div className="relative rounded-lg overflow-hidden border">
                    <div className="flex">
                      <div className="flex-1 relative">
                        <img src={preview!} alt="原图" className="w-full h-auto" />
                        <span className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 text-xs rounded">原图</span>
                      </div>
                      <div className="flex-1 relative" style={{ 
                        backgroundImage: 'linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                      }}>
                        <img src={result} alt="结果" className="w-full h-auto" />
                        <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 text-xs rounded">去除背景</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview when no result and not processing */}
              {!result && !processing && (
                <div className="relative">
                  <img 
                    src={preview!} 
                    alt="Preview" 
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <button
                    onClick={handleClear}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Process Button */}
              {!processing && (
                <button
                  onClick={handleRemoveBg}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  去除背景 {session && `（剩余 ${credits} 积分）`}
                </button>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Download Button */}
              {result && !processing && (
                <a
                  href={result}
                  download="removed-bg.png"
                  className="block w-full py-3 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition"
                >
                  下载结果图片
                </a>
              )}

              {/* Clear Button */}
              <button
                onClick={handleClear}
                className="w-full py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                清除图片
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUpgradeModal(false)}>
          <div className="bg-white rounded-xl p-8 max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl mb-4">🌟</div>
              <h3 className="text-2xl font-bold mb-2">{upgradeMessage}</h3>
              <p className="text-gray-600 mb-6">
                升级到 Pro 版本，解锁无限次使用
              </p>
              
              <div className="space-y-3 mb-6">
                <a
                  href="/pricing"
                  className="block w-full py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium"
                >
                  查看定价方案
                </a>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="block w-full py-2 text-gray-600 hover:text-gray-800 transition"
                >
                  稍后再说
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Powered by Remove.bg API</p>
      </div>
    </main>
  );
}
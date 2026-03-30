'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dailyUsage, setDailyUsage] = useState(0);

  useEffect(() => {
    // 获取用户信息
    fetch('/api/user/info')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          router.push('/');
          return;
        }
        setUser(data.user);
        setCredits(data.credits);
        setDailyUsage(data.dailyUsage);
        setLoading(false);
      })
      .catch(() => {
        router.push('/');
      });
    
    // 获取交易记录
    fetch('/api/user/transactions')
      .then(res => res.json())
      .then(data => {
        if (data.transactions) {
          setTransactions(data.transactions);
        }
      })
      .catch(console.error);
  }, [router]);

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">加载中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href="/" className="text-gray-600 hover:text-gray-800">
              ← 返回首页
            </a>
            <h1 className="text-xl font-bold">个人中心</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
          >
            退出登录
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            {user?.image && (
              <img 
                src={user.image} 
                alt={user.name} 
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold">{user?.name || 'User'}</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Credits Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">⭐ 我的积分</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-amber-600">{credits?.balance || 0}</div>
              <div className="text-sm text-gray-600">当前余额</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{credits?.totalUsed || 0}</div>
              <div className="text-sm text-gray-600">累计使用</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{credits?.bonusReceived || 0}</div>
              <div className="text-sm text-gray-600">奖励积分</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{dailyUsage || 0}</div>
              <div className="text-sm text-gray-600">今日使用</div>
            </div>
          </div>

          <div className="flex gap-4">
            <a
              href="/pricing"
              className="flex-1 py-3 bg-amber-500 text-white text-center rounded-lg hover:bg-amber-600 transition font-medium"
            >
              购买积分 / 升级套餐
            </a>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold mb-4">📜 交易记录</h3>
          
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无交易记录</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(tx.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/pricing"
            className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">💰</div>
            <div className="font-medium">定价方案</div>
          </a>
          <a
            href="/faq"
            className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">❓</div>
            <div className="font-medium">常见问题</div>
          </a>
          <a
            href="/"
            className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">🖼️</div>
            <div className="font-medium">去使用</div>
          </a>
        </div>
      </div>
    </main>
  );
}
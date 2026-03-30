'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const plans = [
  {
    id: 'starter',
    name: '入门版',
    price: 9,
    period: '月',
    credits: 50,
    perCredit: 0.18,
    features: [
      '每月 50 次使用',
      '标准处理速度',
      '邮件支持',
      '有效期30天'
    ],
    highlight: false,
    badge: ''
  },
  {
    id: 'pro',
    name: '专业版',
    price: 39,
    period: '月',
    credits: 400,
    perCredit: 0.10,
    features: [
      '每月 400 次使用',
      '优先处理队列',
      '7x24 在线支持',
      '有效期30天',
      '推荐'
    ],
    highlight: true,
    badge: '最受欢迎'
  },
  {
    id: 'yearly',
    name: '年付优惠',
    price: 199,
    period: '年',
    credits: 600,
    perCredit: 0.33,
    perMonth: 16.6,
    features: [
      '每月约 50 次使用',
      '优先处理队列',
      '7x24 在线支持',
      '有效期365天',
      '85折优惠'
    ],
    highlight: false,
    badge: '省钱'
  }
];

const faqItems = [
  {
    q: '积分会过期吗？',
    a: '购买的积分有效期为购买后30天，请尽快使用。'
  },
  {
    q: '可以退款吗？',
    a: '7天内未使用的积分可申请全额退款。'
  },
  {
    q: '如何查看我的积分余额？',
    a: '登录后可在个人中心查看积分余额和使用记录。'
  },
  {
    q: '支付方式有哪些？',
    a: '支持 PayPal、信用卡等多种支付方式（即将支持更多）。'
  }
];

export default function Pricing() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setSession(data))
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              ← 返回首页
            </Link>
            <h1 className="text-xl font-bold">定价方案</h1>
          </div>
          {session ? (
            <Link
              href="/profile"
              className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              个人中心
            </Link>
          ) : (
            <Link
              href="/api/auth/signin/google"
              className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              登录
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center">
        <h2 className="text-4xl font-bold mb-4">简单透明的定价</h2>
        <p className="text-xl text-gray-600 mb-2">按需购买，无隐藏费用</p>
        <p className="text-gray-500">注册即送 3 次免费试用</p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`rounded-2xl p-6 ${
                plan.highlight 
                  ? 'bg-gradient-to-b from-amber-50 to-white border-2 border-amber-400 shadow-lg' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              {plan.badge && (
                <span className={`inline-block px-3 py-1 rounded-full text-sm mb-3 ${
                  plan.id === 'pro' ? 'bg-amber-500 text-white' : 'bg-green-100 text-green-700'
                }`}>
                  {plan.badge}
                </span>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              
              <div className="mb-4">
                <span className="text-4xl font-bold">¥{plan.price}</span>
                <span className="text-gray-500">/{plan.period}</span>
                {plan.perMonth && (
                  <span className="text-gray-400 text-sm ml-2">≈ ¥{plan.perMonth}/月</span>
                )}
              </div>
              
              <div className="text-3xl font-bold text-green-600 mb-4">
                {plan.credits} 次
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                约 ¥{plan.perCredit}/次
              </p>
              
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                className={`w-full py-3 rounded-lg font-medium transition ${
                  plan.highlight
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => alert('支付功能即将上线，请联系客服购买')}
              >
                立即购买
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h3 className="text-2xl font-bold text-center mb-8">常见问题</h3>
        
        <div className="space-y-4">
          {faqItems.map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
              <h4 className="font-bold text-lg mb-2">Q: {item.q}</h4>
              <p className="text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-500 mb-4">还有其他问题？</p>
          <Link
            href="/faq"
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            查看完整 FAQ →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-amber-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">还没准备好？</h3>
          <p className="text-gray-600 mb-6">
            没关系，先注册体验 3 次免费试用
          </p>
          <div className="flex gap-4 justify-center">
            {session ? (
              <Link
                href="/"
                className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium"
              >
                开始使用
              </Link>
            ) : (
              <Link
                href="/api/auth/signin/google"
                className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium"
              >
                注册免费试用
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
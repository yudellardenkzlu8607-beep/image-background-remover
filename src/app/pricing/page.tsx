'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const plans = [
  {
    id: 'starter',
    name: '体验版',
    price: 9,
    period: '月',
    credits: 50,
    perCredit: 0.18,
    tagline: '适合轻度使用',
    features: [
      '每月 50 次使用',
      '标准处理速度',
      '邮件支持',
      '有效期 30 天',
      '商用授权'
    ],
    highlight: false,
    badge: '',
    cta: '开始体验'
  },
  {
    id: 'pro',
    name: '专业版',
    price: 39,
    period: '月',
    credits: 400,
    perCredit: 0.10,
    tagline: '最适合个人用户',
    features: [
      '每月 400 次使用',
      '优先处理队列',
      '7×24 在线支持',
      '有效期 30 天',
      '商用授权',
      'API 访问权限'
    ],
    highlight: true,
    badge: '最受欢迎',
    cta: '升级专业版'
  },
  {
    id: 'team',
    name: '团队版',
    price: 99,
    period: '月',
    credits: 1200,
    perCredit: 0.08,
    tagline: '适合团队/企业',
    features: [
      '每月 1200 次使用',
      '极速处理队列',
      '专属客户经理',
      '有效期 30 天',
      '完整商用授权',
      '多账号协作',
      '发票开具'
    ],
    highlight: false,
    badge: '',
    cta: '团队咨询'
  }
];

const yearlyPlan = {
  name: '年付特惠',
  price: 199,
  period: '年',
  credits: 600,
  perMonth: 16.6,
  savings: '省 43%',
  tagline: '适合长期用户',
  features: [
    '每月约 50 次使用',
    '优先处理队列',
    '7×24 在线支持',
    '有效期 365 天',
    '完整商用授权'
  ],
  badge: '限时优惠'
};

const comparisons = [
  { feature: '每日免费次数', free: '1次', pro: '无限制' },
  { feature: '每月使用额度', free: '0', pro: '400次' },
  { feature: '处理速度', free: '标准', pro: '优先' },
  { feature: '商用授权', free: '❌', pro: '✅' },
  { feature: '客户支持', free: '无', pro: '7×24' },
  { feature: 'API 访问', free: '❌', pro: '✅' }
];

const testimonials = [
  {
    name: '李设计师',
    avatar: '👨‍🎨',
    content: '每天要给客户处理几十张产品图，用了这个工具效率提升了好几倍！',
    rating: 5
  },
  {
    name: '王电商',
    avatar: '👩‍💼',
    content: '电商主图需要透明背景，这个工具效果很好，批量处理超方便。',
    rating: 5
  },
  {
    name: '张摄影师',
    avatar: '📷',
    content: '修图必备，省去了手动抠图的时间，成本也很划算。',
    rating: 5
  }
];

export default function Pricing() {
  const [session, setSession] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setSession(data))
      .catch(console.error);
  }, []);

  const getPrice = (plan: typeof plans[0]) => {
    if (billingCycle === 'yearly' && plan.id === 'pro') {
      return Math.round(plan.price * 12 * 0.5);
    }
    return plan.price;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-800 flex items-center gap-2">
              <span>←</span>
              <span>返回</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href="/profile"
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                我的积分
              </Link>
            ) : (
              <Link
                href="/api/auth/signin/google"
                className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                登录 / 注册
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 text-center px-4">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span>🎁</span>
          <span>新用户注册即送 3 次免费试用</span>
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
          简单透明，按需付费
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          无隐藏费用，无订阅陷阱。AI 驱动的背景移除，让你的工作更高效
        </p>
        
        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-full p-1 mb-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'monthly' 
                ? 'bg-white shadow text-gray-900' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            月付
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'yearly' 
                ? 'bg-white shadow text-gray-900' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            年付
            <span className="ml-2 text-green-600 text-xs">省 50%</span>
          </button>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative rounded-3xl p-8 transition-all duration-300 ${
                plan.highlight 
                  ? 'bg-gradient-to-b from-amber-50 to-white border-2 border-amber-400 shadow-xl shadow-amber-200/50 scale-105' 
                  : 'bg-white border border-gray-200 hover:shadow-lg hover:border-gray-300'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.tagline}</p>
              </div>
              
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-gray-400">¥</span>
                  <span className="text-5xl font-bold text-gray-900">
                    {getPrice(plan)}
                  </span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
                {billingCycle === 'yearly' && plan.id === 'pro' && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    相当于 ¥{Math.round(getPrice(plan)/12)}/月
                  </div>
                )}
              </div>
              
              <div className="text-center mb-6 pb-6 border-b border-gray-100">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full">
                  <span className="text-lg">⚡</span>
                  <span className="font-bold">{plan.credits}</span>
                  <span className="text-sm">次/月</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  约 ¥{plan.perCredit}/次
                </p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-200'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
                onClick={() => alert('支付功能即将上线，敬请期待！')}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Yearly Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {yearlyPlan.badge}
            </span>
          </div>
          <h3 className="text-2xl font-bold mb-2">{yearlyPlan.name}</h3>
          <p className="text-white/80 mb-4">{yearlyPlan.tagline}</p>
          <div className="flex items-baseline justify-center gap-2 mb-4">
            <span className="text-sm text-white/70">¥</span>
            <span className="text-5xl font-bold">199</span>
            <span className="text-white/70">/年</span>
          </div>
          <p className="text-sm text-white/80 mb-6">
            相当于 ¥{yearlyPlan.perMonth}/月 · 约 50次/月
          </p>
          <div className="flex items-center justify-center gap-6 text-sm mb-6">
            {yearlyPlan.features.slice(0, 4).map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <span>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
          <button
            className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition"
            onClick={() => alert('支付功能即将上线，敬请期待！')}
          >
            立即节省 {yearlyPlan.savings}
          </button>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">免费版 vs 专业版</h2>
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="grid grid-cols-3 bg-gray-50">
            <div className="p-4 font-medium text-gray-500">功能</div>
            <div className="p-4 font-medium text-center text-gray-400">免费版</div>
            <div className="p-4 font-medium text-center bg-amber-50">专业版</div>
          </div>
          {comparisons.map((item, i) => (
            <div key={i} className="grid grid-cols-3 border-t">
              <div className="p-4 text-gray-700">{item.feature}</div>
              <div className="p-4 text-center text-gray-600">{item.free}</div>
              <div className="p-4 text-center bg-amber-50/50 font-medium text-gray-900">{item.pro}</div>
            </div>
          ))}
          <div className="grid grid-cols-3 border-t bg-gray-50">
            <div className="p-4 font-medium text-gray-700">价格</div>
            <div className="p-4 text-center text-gray-400">免费</div>
            <div className="p-4 text-center bg-amber-50 font-medium">
              <span className="text-amber-600">¥39/月</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">用户怎么说</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <span key={j} className="text-amber-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4">{t.content}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                  {t.avatar}
                </div>
                <span className="font-medium text-gray-900">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span>支付安全</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💯</span>
              <span>7天退款保证</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📱</span>
              <span>随时取消</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>即时开通</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">常见问题</h2>
        <div className="space-y-4">
          {[
            { q: '积分会过期吗？', a: '购买的积分有效期为购买后30天，注册赠送的积分无有效期限制。' },
            { q: '可以退款吗？', a: '7天内未使用的积分可申请全额退款，联系客服即可办理。' },
            { q: '如何查看积分余额？', a: '登录后访问个人中心，可以查看当前余额、累计使用和交易记录。' },
            { q: '支持哪些支付方式？', a: '支持 PayPal、信用卡等多种支付方式，更多方式即将上线。' }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border">
              <h4 className="font-bold text-lg mb-2">Q: {item.q}</h4>
              <p className="text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <Link
            href="/faq"
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            查看完整 FAQ →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">准备好开始了吗？</h3>
          <p className="text-gray-400 mb-8">
            注册即送 3 次免费试用，体验 AI 驱动的背景移除
          </p>
          <div className="flex gap-4 justify-center">
            {session ? (
              <Link
                href="/"
                className="px-8 py-4 bg-amber-500 text-gray-900 rounded-xl font-semibold hover:bg-amber-400 transition"
              >
                开始使用
              </Link>
            ) : (
              <>
                <Link
                  href="/api/auth/signin/google"
                  className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition"
                >
                  免费注册试用
                </Link>
                <button
                  onClick={() => alert('客服联系方式即将上线')}
                  className="px-8 py-4 bg-transparent border border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition"
                >
                  联系我们
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
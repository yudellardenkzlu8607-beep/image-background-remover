'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqCategories = [
  {
    title: '基础问题',
    items: [
      {
        q: '什么是 AI 图片背景移除？',
        a: '利用先进的人工智能技术，自动识别图片中的主体并移除背景，生成带透明通道的 PNG 图片。'
      },
      {
        q: '支持哪些图片格式？',
        a: '支持 JPG、PNG、WebP 等常见格式。单张图片大小建议不超过 10MB。'
      },
      {
        q: '处理一张图片需要多长时间？',
        a: '通常在 5-10 秒内完成，具体取决于图片大小和网络状况。'
      },
      {
        q: '处理后的图片质量如何？',
        a: '我们使用行业领先的 Remove.bg API，处理效果出色，边缘清晰，适合商用。'
      }
    ]
  },
  {
    title: '积分与费用',
    items: [
      {
        q: '注册后有多少免费额度？',
        a: '新用户注册后首次使用时会获得 3 次免费积分，可以体验完整功能。'
      },
      {
        q: '每日使用有限制吗？',
        a: '未登录用户每日限用 1 次，登录用户无每日限制，按积分扣减。'
      },
      {
        q: '积分会过期吗？',
        a: '购买获得的积分有效期为购买后 30 天，注册赠送的积分无有效期限制。'
      },
      {
        q: '可以退款吗？',
        a: '7 天内未使用的积分可申请全额退款，联系客服处理。'
      },
      {
        q: '如何查看我的积分余额？',
        a: '登录后访问个人中心，可以查看当前余额、累计使用和交易记录。'
      }
    ]
  },
  {
    title: '支付问题',
    items: [
      {
        q: '支持哪些支付方式？',
        a: '目前支持 PayPal 和信用卡支付，其他支付方式（微信、支付宝）即将上线。'
      },
      {
        q: '支付安全吗？',
        a: '所有支付通过 PayPal 官方处理，我们不会存储您的支付信息，确保安全。'
      },
      {
        q: '可以开具发票吗？',
        a: '可以，联系客服提供企业信息即可开具增值税普通或专用发票。'
      }
    ]
  },
  {
    title: '技术问题',
    items: [
      {
        q: '我的图片会被保存吗？',
        a: '不会。处理完成后，原图和结果图会立即删除，不会存储在我们的服务器上。'
      },
      {
        q: '批量处理支持吗？',
        a: 'API 用户支持批量处理，当前网页版暂不支持批量上传。'
      },
      {
        q: '可以用于商业用途吗？',
        a: '付费用户拥有商业使用权，可将处理后的图片用于商业项目。'
      },
      {
        q: '遇到问题怎么办？',
        a: '可以通过页面底部的联系方式联系我们，或发送邮件至 support@example.com'
      }
    ]
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              ← 返回首页
            </Link>
            <h1 className="text-xl font-bold">常见问题</h1>
          </div>
          <Link
            href="/pricing"
            className="px-4 py-2 text-sm rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
          >
            查看定价
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 text-center">
        <h2 className="text-3xl font-bold mb-4">有疑问？这里有答案</h2>
        <p className="text-gray-600">找不到答案？联系我们的客服</p>
      </section>

      {/* FAQ Content */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        {/* Category Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {faqCategories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(i)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                activeCategory === i
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqCategories[activeCategory].items.map((item, i) => (
            <div 
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-4 text-left flex justify-between items-center"
              >
                <span className="font-medium text-lg">Q: {item.q}</span>
                <span className={`text-amber-500 text-xl transition-transform ${openIndex === i ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {openIndex === i && (
                <div className="px-6 pb-4 text-gray-600">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">还有其他问题？</h3>
          <p className="text-gray-600 mb-4">我们的团队随时为您服务</p>
          <button
            onClick={() => alert('客服联系方式即将上线')}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium"
          >
            联系客服
          </button>
        </div>
      </section>
    </main>
  );
}
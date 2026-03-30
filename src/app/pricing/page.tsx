'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'month',
    credits: 5,
    creditsPeriod: 'month',
    perCredit: 0,
    tagline: 'Get started with basic background removal',
    features: [
      '5 photos per month',
      'Standard processing',
      'Basic support',
      'No credit card required'
    ],
    highlight: false,
    badge: '',
    cta: 'Get started',
    annualPrice: 0,
    annualNote: ''
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 10,
    period: 'month',
    credits: null,
    creditsPeriod: 'unlimited',
    perCredit: 0,
    tagline: 'Unlimited access for professionals',
    features: [
      'Unlimited photos per month',
      'Priority processing',
      '24/7 support',
      'Commercial license',
      'API access'
    ],
    highlight: true,
    badge: 'Most popular',
    cta: 'Get started',
    annualPrice: 69,
    annualPerMonth: 5.75,
    annualNote: 'Billed annually'
  }
];

const faqItems = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, you can cancel your subscription at any time with no hidden fees.'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept PayPal and all major credit cards (Visa, Mastercard, American Express).'
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes! Every user starts with 5 free photos per month. No credit card required.'
  },
  {
    q: 'Do unused photos roll over?',
    a: 'No, your monthly photo allowance does not roll over to the next month.'
  }
];

export default function Pricing() {
  const [session, setSession] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setSession(data))
      .catch(console.error);
  }, []);

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (plan.id === 'free') {
      alert('Free plan activated! You can start using the service now.');
      return;
    }
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handleCheckout = () => {
    if (!email) {
      alert('Please enter your email address');
      return;
    }
    alert('Payment integration coming soon! You will be redirected to PayPal checkout.');
  };

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.id === 'free') return 0;
    return billingCycle === 'annual' ? plan.annualPrice : plan.price;
  };

  const getPriceDisplay = (plan: typeof plans[0]) => {
    if (plan.id === 'free') return '$0';
    if (billingCycle === 'annual') return `$${plan.annualPrice}`;
    return `$${plan.price}`;
  };

  const getPricePeriod = (plan: typeof plans[0]) => {
    if (plan.id === 'free') return '/month';
    if (billingCycle === 'annual') return '/year';
    return '/month';
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              ← Back
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href="/profile"
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                My Account
              </Link>
            ) : (
              <Link
                href="/api/auth/signin/google"
                className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-500">
            No hidden fees. Cancel anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        {plans.some(p => p.annualPrice) && (
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingCycle === 'annual' ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  billingCycle === 'annual' ? 'left-8' : 'left-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual
              <span className="ml-1 text-green-600 font-semibold">-42%</span>
            </span>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative rounded-2xl p-8 border-2 transition-all ${
                plan.highlight 
                  ? 'border-blue-500 bg-blue-50/30' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              {/* Plan Name & Tagline */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.tagline}</p>
              </div>
              
              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">
                    {getPriceDisplay(plan)}
                  </span>
                  <span className="text-gray-500">{getPricePeriod(plan)}</span>
                </div>
                {plan.annualNote && billingCycle === 'annual' && (
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.annualNote} (${plan.annualPerMonth}/month)
                  </p>
                )}
              </div>
              
              {/* Credits */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <p className="text-gray-700">
                  {plan.credits ? `${plan.credits} photos` : 'Unlimited photos'} 
                  <span className="text-gray-400"> / month</span>
                </p>
              </div>
              
              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.highlight
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Annual Discount Highlight */}
        {billingCycle === 'annual' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-8">
            <p className="text-green-700 font-medium">
              🌿 You save $51 per year with annual billing!
            </p>
          </div>
        )}

        {/* Need More Section */}
        <div className="text-center mb-12">
          <p className="text-gray-500">
            Need more? <a href="mailto:support@example.com" className="text-blue-500 hover:underline">Contact us</a> for custom pricing.
          </p>
        </div>

        {/* Comparison */}
        <div className="border-t pt-8 mb-8">
          <h2 className="text-xl font-bold text-center mb-6">What's included</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 text-gray-500 font-medium">Feature</th>
                  <th className="text-center py-3 text-gray-500 font-medium">Free</th>
                  <th className="text-center py-3 text-gray-900 font-medium bg-blue-50 rounded-t-lg">Pro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Photos per month', '5', 'Unlimited'],
                  ['Processing speed', 'Standard', 'Priority'],
                  ['Commercial license', '❌', '✅'],
                  ['API access', '❌', '✅'],
                  ['Support', 'Basic', '24/7']
                ].map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-3 text-gray-700">{row[0]}</td>
                    <td className="py-3 text-center text-gray-600">{row[1]}</td>
                    <td className="py-3 text-center bg-blue-50/50 font-medium">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="border-t pt-8">
          <h2 className="text-xl font-bold text-center mb-6">Frequently asked questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqItems.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Q: {item.q}</h4>
                <p className="text-sm text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Order Summary</h3>
              <button 
                onClick={() => setShowCheckout(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {/* Plan Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{selectedPlan.name} Plan</span>
                <span className="font-bold">
                  {getPriceDisplay(selectedPlan)}{getPricePeriod(selectedPlan)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {selectedPlan.credits ? `${selectedPlan.credits} photos` : 'Unlimited photos'} per month
              </p>
              {billingCycle === 'annual' && (
                <p className="text-sm text-green-600 mt-1">
                  Annual billing - save 42%
                </p>
              )}
            </div>
            
            {/* Email Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment method
              </label>
              <div className="flex gap-3">
                <button className="flex-1 py-3 border-2 border-blue-500 bg-blue-50 rounded-lg font-medium">
                  <span className="text-blue-600">PayPal</span>
                </button>
                <button className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
                  Card
                </button>
              </div>
            </div>
            
            {/* CTA */}
            <button
              onClick={handleCheckout}
              className="w-full py-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition"
            >
              Get started
            </button>
            
            {/* Note */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Your free photos will be credited when you upgrade.
            </p>
          </div>
        </div>
      )

      {/* Footer */}
      <footer className="bg-gray-50 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 Image Background Remover. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/faq" className="hover:text-gray-700">FAQ</a>
            <a href="mailto:support@example.com" className="hover:text-gray-700">Contact</a>
            <a href="#" className="hover:text-gray-700">Privacy</a>
            <a href="#" className="hover:text-gray-700">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
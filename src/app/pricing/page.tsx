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
    tagline: 'Get started with basic background removal',
    features: ['5 photos per month', 'Standard processing', 'Basic support', 'No credit card required'],
    highlight: false,
    cta: 'Get started',
    annualPrice: 0,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 10,
    period: 'month',
    credits: null,
    tagline: 'Unlimited access for professionals',
    features: ['Unlimited photos per month', 'Priority processing', '24/7 support', 'Commercial license', 'API access'],
    highlight: true,
    cta: 'Get started',
    annualPrice: 69,
    annualPerMonth: 5.75,
  }
];

export default function Pricing() {
  const [session, setSession] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setSession(data))
      .catch(console.error);
  }, []);

  const getPriceDisplay = (plan: any) => {
    if (plan.id === 'free') return '$0';
    if (billingCycle === 'annual') return `$${plan.annualPrice}`;
    return `$${plan.price}`;
  };

  const getPricePeriod = (plan: any) => {
    if (plan.id === 'free') return '/month';
    if (billingCycle === 'annual') return '/year';
    return '/month';
  };

  const handleSelectPlan = (plan: any) => {
    if (plan.id === 'free') {
      alert('Free plan activated!');
      return;
    }
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 0' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>← Back</Link>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {session ? (
              <Link href="/profile" style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#374151', textDecoration: 'none', fontSize: '14px' }}>
                My Account
              </Link>
            ) : (
              <Link href="/api/auth/signin/google" style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', textDecoration: 'none', fontSize: '14px' }}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '48px 16px' }}>
        {/* Page Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>No hidden fees. Cancel anytime.</p>
        </div>

        {/* Billing Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: billingCycle === 'monthly' ? '#111827' : '#9ca3af' }}>Monthly</span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            style={{
              width: '56px', height: '28px', borderRadius: '9999px', position: 'relative',
              backgroundColor: billingCycle === 'annual' ? '#22c55e' : '#d1d5db',
              border: 'none', cursor: 'pointer', transition: 'background-color 0.2s'
            }}
          >
            <span style={{
              position: 'absolute', top: '4px',
              left: billingCycle === 'annual' ? '32px' : '4px',
              width: '20px', height: '20px', borderRadius: '50%',
              backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'left 0.2s'
            }} />
          </button>
          <span style={{ fontSize: '14px', fontWeight: '500', color: billingCycle === 'annual' ? '#111827' : '#9ca3af' }}>
            Annual<span style={{ marginLeft: '4px', color: '#16a34a', fontWeight: '600' }}>-42%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          {plans.map((plan) => (
            <div key={plan.id} style={{
              borderRadius: '16px', padding: '32px',
              border: plan.highlight ? '2px solid #3b82f6' : '2px solid #e5e7eb',
              backgroundColor: plan.highlight ? 'rgba(59, 130, 246, 0.05)' : 'white',
              position: 'relative'
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  backgroundColor: '#3b82f6', color: 'white', padding: '4px 16px',
                  borderRadius: '9999px', fontSize: '14px', fontWeight: '500'
                }}>
                  Most popular
                </div>
              )}
              
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>{plan.name}</h3>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>{plan.tagline}</p>
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#111827' }}>{getPriceDisplay(plan)}</span>
                  <span style={{ color: '#6b7280' }}>{getPricePeriod(plan)}</span>
                </div>
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <p style={{ color: '#374151' }}>{plan.credits ? `${plan.credits} photos` : 'Unlimited photos'} <span style={{ color: '#9ca3af' }}>/ month</span></p>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '32px' }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
                    <span style={{ color: '#22c55e' }}>✓</span>
                    <span style={{ color: '#374151' }}>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleSelectPlan(plan)}
                style={{
                  width: '100%', padding: '12px', borderRadius: '8px',
                  fontWeight: '600', fontSize: '16px',
                  backgroundColor: plan.highlight ? '#3b82f6' : '#111827',
                  color: 'white', border: 'none', cursor: 'pointer'
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Annual Discount */}
        {billingCycle === 'annual' && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '32px' }}>
            <p style={{ color: '#15803d', fontWeight: '500' }}>🌿 You save $51 per year with annual billing!</p>
          </div>
        )}

        {/* Comparison Table */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '24px' }}>What&apos;s included</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#6b7280', fontWeight: '500' }}>Feature</th>
                <th style={{ textAlign: 'center', padding: '12px 8px', color: '#6b7280', fontWeight: '500' }}>Free</th>
                <th style={{ textAlign: 'center', padding: '12px 8px', color: '#111827', fontWeight: '500', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px 8px 0 0' }}>Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Photos per month', '5', 'Unlimited'],
                ['Processing speed', 'Standard', 'Priority'],
                ['Commercial license', '—', '✓'],
                ['API access', '—', '✓'],
                ['Support', 'Basic', '24/7']
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 8px', color: '#374151' }}>{row[0]}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: '#6b7280' }}>{row[1]}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', backgroundColor: 'rgba(59, 130, 246, 0.05)', fontWeight: '500' }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '24px' }}>Frequently asked questions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time with no hidden fees.' },
              { q: 'What payment methods do you accept?', a: 'We accept PayPal and all major credit cards.' },
              { q: 'Is there a free trial?', a: 'Yes! Every user starts with 5 free photos per month. No credit card required.' },
              { q: 'Do unused photos roll over?', a: 'No, your monthly photo allowance does not roll over to the next month.' }
            ].map((item, i) => (
              <div key={i} style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ fontWeight: '500', color: '#111827', marginBottom: '8px' }}>Q: {item.q}</h4>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedPlan && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '448px', width: '100%', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Order Summary</h3>
              <button onClick={() => setShowCheckout(false)} style={{ color: '#9ca3af', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '500' }}>{selectedPlan.name} Plan</span>
                <span style={{ fontWeight: 'bold' }}>{getPriceDisplay(selectedPlan)}{getPricePeriod(selectedPlan)}</span>
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                {selectedPlan.credits ? `${selectedPlan.credits} photos` : 'Unlimited photos'} per month
              </p>
            </div>
            
            <button
              onClick={() => alert('Payment integration coming soon!')}
              style={{ width: '100%', padding: '16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '12px', fontWeight: '600', fontSize: '16px', border: 'none', cursor: 'pointer' }}
            >
              Get started
            </button>
            
            <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '16px' }}>
              Secure payment via PayPal or Card
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ backgroundColor: '#f9fafb', padding: '32px 0', marginTop: '48px' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          <p>© 2026 Image Background Remover. All rights reserved.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
            <Link href="/faq" style={{ color: '#6b7280', textDecoration: 'none' }}>FAQ</Link>
            <a href="mailto:support@example.com" style={{ color: '#6b7280', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
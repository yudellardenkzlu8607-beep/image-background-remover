'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    tagline: 'Get started with basic background removal',
    features: ['5 photos per month', 'Standard processing', 'Basic support', 'No credit card required'],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$10',
    tagline: 'Unlimited access for professionals',
    features: ['Unlimited photos per month', 'Priority processing', '24/7 support', 'Commercial license', 'API access', 'Remove watermark'],
    highlight: true,
    annualPrice: '$69/year',
    annualSaving: 'Save $51',
  }
];

const comparisonFeatures = [
  { name: 'Photos per month', free: '5', pro: 'Unlimited' },
  { name: 'Processing speed', free: 'Standard', pro: 'Priority' },
  { name: 'Commercial license', free: false, pro: true },
  { name: 'API access', free: false, pro: true },
  { name: 'Remove watermark', free: false, pro: true },
  { name: 'Background options', free: 'Original only', pro: 'Original + White + Transparent + Custom' },
  { name: 'Priority support', free: 'Basic', pro: '24/7' },
];

export default function Pricing() {
  const [session, setSession] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setSession(data))
      .catch(console.error);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 0' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>← Back</Link>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {session ? (
              <Link href="/profile" style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#374151', textDecoration: 'none', fontSize: '14px' }}>
                My Account
              </Link>
            ) : (
              <Link href="/api/auth/signin/google" style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', fontSize: '14px' }}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Page Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Simple pricing
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280' }}>No hidden fees. Cancel anytime.</p>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {plans.map((plan) => (
            <div key={plan.id} style={{
              borderRadius: '12px', padding: '24px',
              border: plan.highlight ? '2px solid #2563eb' : '1px solid #e5e7eb',
              backgroundColor: plan.highlight ? '#eff6ff' : 'white',
              position: 'relative'
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                  backgroundColor: '#2563eb', color: 'white', padding: '2px 12px',
                  borderRadius: '9999px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap'
                }}>
                  Most popular
                </div>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{plan.name}</h3>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>{plan.tagline}</p>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>
                    {billingCycle === 'annual' && plan.annualPrice ? plan.annualPrice : plan.price}
                  </span>
                  {plan.annualPrice && (
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>/year</span>
                  )}
                </div>
                {plan.annualSaving && (
                  <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '500' }}>{plan.annualSaving}</span>
                )}
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: '#374151' }}>
                    <span style={{ color: '#22c55e', fontSize: '14px' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                style={{
                  width: '100%', padding: '10px', borderRadius: '8px',
                  fontWeight: '500', fontSize: '14px',
                  backgroundColor: plan.highlight ? '#2563eb' : '#f9fafb',
                  color: plan.highlight ? 'white' : '#374151',
                  border: plan.highlight ? 'none' : '1px solid #d1d5db',
                  cursor: 'pointer'
                }}
              >
                {plan.id === 'free' ? 'Get started' : 'Get started'}
              </button>
            </div>
          ))}
        </div>

        {/* Billing Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '14px', color: billingCycle === 'monthly' ? '#111827' : '#9ca3af', fontWeight: billingCycle === 'monthly' ? '500' : '400' }}>Monthly</span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            style={{
              width: '40px', height: '24px', borderRadius: '9999px',
              backgroundColor: billingCycle === 'annual' ? '#22c55e' : '#d1d5db',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background-color 0.2s'
            }}
          >
            <span style={{
              position: 'absolute', top: '2px',
              left: billingCycle === 'annual' ? '20px' : '2px',
              width: '20px', height: '20px', borderRadius: '50%',
              backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              transition: 'left 0.2s'
            }} />
          </button>
          <span style={{ fontSize: '14px', color: billingCycle === 'annual' ? '#111827' : '#9ca3af', fontWeight: billingCycle === 'annual' ? '500' : '400' }}>
            Annual
            {billingCycle === 'annual' && (
              <span style={{ marginLeft: '4px', color: '#16a34a', fontWeight: '500' }}>-42%</span>
            )}
          </span>
        </div>

        {/* Annual Saving Banner */}
        {billingCycle === 'annual' && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', textAlign: 'center', marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', color: '#15803d', fontWeight: '500' }}>🌿 You save $51 per year with annual billing!</p>
          </div>
        )}

        {/* Comparison Table */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: '#6b7280' }}>Feature</div>
            <div style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: '#6b7280', textAlign: 'center' }}>Free</div>
            <div style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#111827', textAlign: 'center', backgroundColor: '#eff6ff' }}>Pro</div>
          </div>
          {/* Table Rows */}
          {comparisonFeatures.map((feature, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
              borderBottom: i < comparisonFeatures.length - 1 ? '1px solid #e5e7eb' : 'none'
            }}>
              <div style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{feature.name}</div>
              <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
                {typeof feature.free === 'boolean' ? (
                  feature.free ? <span style={{ color: '#22c55e' }}>✓</span> : <span style={{ color: '#d1d5db' }}>—</span>
                ) : feature.free}
              </div>
              <div style={{ padding: '12px 16px', fontSize: '13px', color: '#111827', textAlign: 'center', fontWeight: '500', backgroundColor: 'rgba(239, 246, 255, 0.3)' }}>
                {typeof feature.pro === 'boolean' ? (
                  feature.pro ? <span style={{ color: '#22c55e' }}>✓</span> : <span style={{ color: '#d1d5db' }}>—</span>
                ) : feature.pro}
              </div>
            </div>
          ))}
        </div>

        {/* Need More Section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Need more? <a href="mailto:support@example.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Contact us</a> for custom pricing.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#f9fafb', padding: '24px 0', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
          <p>© 2026 Image Background Remover. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
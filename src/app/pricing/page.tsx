'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const creditPackages = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 9,
    pricePerCredit: 0.18,
    tagline: 'Perfect for occasional use',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 200,
    price: 29,
    pricePerCredit: 0.145,
    tagline: 'Best value for individuals',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    credits: 500,
    price: 59,
    pricePerCredit: 0.118,
    tagline: 'For teams and heavy users',
    popular: false,
  },
];

const subscriptionPlans = [
  {
    id: 'pro-monthly',
    name: 'Pro Monthly',
    credits: 'Unlimited',
    price: 10,
    period: 'month',
    tagline: 'Unlimited access, cancel anytime',
    features: ['Unlimited photos', 'Priority processing', '24/7 support', 'Commercial license', 'API access'],
  },
  {
    id: 'pro-yearly',
    name: 'Pro Yearly',
    credits: 'Unlimited',
    price: 69,
    period: 'year',
    tagline: 'Save 42% compared to monthly',
    features: ['Everything in Pro Monthly', '2 months free', 'Priority support'],
  },
];

export default function Pricing() {
  const [session, setSession] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [activeTab, setActiveTab] = useState<'credits' | 'subscription'>('credits');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setSession(data);
        if (data?.user?.email) setEmail(data.user.email);
      })
      .catch(console.error);
  }, []);

  const handleGetStarted = (item: any, type: string) => {
    if (type === 'credits') {
      // One-time purchase
      setSelectedItem({ ...item, type: 'credits' });
    } else {
      // Subscription
      setSelectedItem({ ...item, type: 'subscription' });
    }
    setShowCheckout(true);
  };

  const handleCheckout = () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }
    alert('PayPal integration coming soon! You will be redirected to complete your purchase.');
  };

  const getFinalPrice = (item: any) => {
    if (item.type === 'subscription' && item.id === 'pro-yearly') {
      return '$69';
    }
    return item.price ? `$${item.price}` : item.credits;
  };

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
            Pricing
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280' }}>Choose a plan that works for you</p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
            <button
              onClick={() => setActiveTab('credits')}
              style={{
                padding: '8px 24px', borderRadius: '6px', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                backgroundColor: activeTab === 'credits' ? 'white' : 'transparent',
                color: activeTab === 'credits' ? '#111827' : '#6b7280',
                boxShadow: activeTab === 'credits' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Credits
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              style={{
                padding: '8px 24px', borderRadius: '6px', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                backgroundColor: activeTab === 'subscription' ? 'white' : 'transparent',
                color: activeTab === 'subscription' ? '#111827' : '#6b7280',
                boxShadow: activeTab === 'subscription' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Subscription
            </button>
          </div>
        </div>

        {/* Credits Section */}
        {activeTab === 'credits' && (
          <>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
              One-time purchase. Credits never expire.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {creditPackages.map((pkg) => (
                <div key={pkg.id} style={{
                  borderRadius: '12px', padding: '24px',
                  border: pkg.popular ? '2px solid #2563eb' : '1px solid #e5e7eb',
                  backgroundColor: pkg.popular ? '#eff6ff' : 'white',
                  position: 'relative'
                }}>
                  {pkg.popular && (
                    <div style={{
                      position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                      backgroundColor: '#2563eb', color: 'white', padding: '2px 12px',
                      borderRadius: '9999px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap'
                    }}>
                      Best value
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{pkg.name}</h3>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>{pkg.tagline}</p>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>${pkg.price}</span>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>/ once</span>
                    </div>
                  </div>
                  
                  <div style={{ backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>{pkg.credits}</span>
                    <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '4px' }}>credits</span>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>${pkg.pricePerCredit}/credit</p>
                  </div>
                  
                  <button
                    onClick={() => handleGetStarted(pkg, 'credits')}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '8px',
                      fontWeight: '500', fontSize: '14px',
                      backgroundColor: pkg.popular ? '#2563eb' : '#f9fafb',
                      color: pkg.popular ? 'white' : '#374151',
                      border: pkg.popular ? 'none' : '1px solid #d1d5db',
                      cursor: 'pointer'
                    }}
                  >
                    Buy now
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Subscription Section */}
        {activeTab === 'subscription' && (
          <>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
              Unlimited access. Cancel anytime.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {subscriptionPlans.map((plan) => (
                <div key={plan.id} style={{
                  borderRadius: '12px', padding: '24px',
                  border: plan.id === 'pro-yearly' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                  backgroundColor: plan.id === 'pro-yearly' ? '#eff6ff' : 'white',
                  position: 'relative'
                }}>
                  {plan.id === 'pro-yearly' && (
                    <div style={{
                      position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                      backgroundColor: '#16a34a', color: 'white', padding: '2px 12px',
                      borderRadius: '9999px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap'
                    }}>
                      Save 42%
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{plan.name}</h3>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>{plan.tagline}</p>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>${plan.price}</span>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>/{plan.period}</span>
                    </div>
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
                    onClick={() => handleGetStarted(plan, 'subscription')}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '8px',
                      fontWeight: '500', fontSize: '14px',
                      backgroundColor: plan.id === 'pro-yearly' ? '#2563eb' : '#f9fafb',
                      color: plan.id === 'pro-yearly' ? 'white' : '#374151',
                      border: plan.id === 'pro-yearly' ? 'none' : '1px solid #d1d5db',
                      cursor: 'pointer'
                    }}
                  >
                    Subscribe
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Need More Section */}
        <div style={{ textAlign: 'center', marginTop: '32px', padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Need a custom plan?</p>
          <a href="mailto:support@example.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Contact us</a>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                {selectedItem.type === 'credits' ? 'Purchase Credits' : 'Subscribe'}
              </h3>
              <button onClick={() => setShowCheckout(false)} style={{ color: '#9ca3af', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            {/* Order Summary */}
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '500' }}>{selectedItem.name}</span>
                <span style={{ fontWeight: '600' }}>
                  {selectedItem.type === 'credits' ? `$${selectedItem.price}` : `$${selectedItem.price}/${selectedItem.period}`}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                {selectedItem.credits ? `${selectedItem.credits} credits` : 'Unlimited photos per month'}
              </p>
              {selectedItem.type === 'subscription' && selectedItem.id === 'pro-yearly' && (
                <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>Billed annually - save 42%</p>
              )}
              {selectedItem.type === 'credits' && (
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Credits never expire</p>
              )}
            </div>
            
            {/* Email Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              />
            </div>
            
            {/* PayPal Button */}
            <button
              onClick={handleCheckout}
              style={{
                width: '100%', padding: '12px',
                backgroundColor: '#ffc439', color: '#003087',
                border: 'none', borderRadius: '8px',
                fontWeight: '600', fontSize: '14px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <span style={{ fontSize: '16px' }}>P</span>
              Pay with PayPal
            </button>
            
            {/* Secure Note */}
            <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginTop: '12px' }}>
              Secure payment processed by PayPal
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ backgroundColor: '#f9fafb', padding: '24px 0', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
          <p>© 2026 Image Background Remover. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
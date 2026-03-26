'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    OAuthSignin: '登录时出错，请重试',
    OAuthCallback: '从 Google 获取信息时出错',
    OAuthCreateAccount: '创建账户时出错',
    EmailSignin: '邮箱登录出错',
    Callback: '回调处理出错',
    OAuthAccountNotLinked: '该邮箱已关联其他账号',
    SessionRequired: '需要登录才能访问',
    Default: '发生未知错误',
  };

  const errorMessage = error ? (errorMessages[error] || errorMessages.Default) : errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          登录出错
        </h2>

        <p className="text-gray-600 mb-6">
          {errorMessage}
        </p>

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            重新登录
          </Link>

          <Link
            href="/"
            className="block w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <ErrorContent />
    </Suspense>
  );
}

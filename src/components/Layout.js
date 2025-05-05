import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

function Layout({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 바 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/">
                  <h1 className="text-xl font-bold text-blue-600">문서관리 시스템</h1>
                </Link>
              </div>
              <div className="ml-6 flex space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    location.pathname === '/' 
                      ? 'text-blue-600 border-b-2 border-blue-500' 
                      : 'text-gray-900 border-b-2 border-transparent hover:border-blue-500'
                  }`}
                >
                  내 문서
                </Link>
                <Link
                  to="/all-documents"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    location.pathname === '/all-documents' 
                      ? 'text-blue-600 border-b-2 border-blue-500' 
                      : 'text-gray-900 border-b-2 border-transparent hover:border-blue-500'
                  }`}
                >
                  전체 문서
                </Link>
                <Link
                  to="/upload"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    location.pathname === '/upload' 
                      ? 'text-blue-600 border-b-2 border-blue-500' 
                      : 'text-gray-900 border-b-2 border-transparent hover:border-blue-500'
                  }`}
                >
                  문서 업로드
                </Link>
                {user && user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      location.pathname === '/admin' 
                        ? 'text-blue-600 border-b-2 border-blue-500' 
                        : 'text-gray-900 border-b-2 border-transparent hover:border-blue-500'
                    }`}
                  >
                    관리자 대시보드
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">{user.email}</span>
                    {user.role === 'admin' && <span className="ml-1 text-xs text-blue-600">(관리자)</span>}
                  </span>
                  <button
                    onClick={logout}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main>{children}</main>
    </div>
  );
}

export default Layout; 
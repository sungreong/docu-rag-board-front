import React from 'react';
import { Link } from 'react-router-dom';

function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          <svg 
            className="mx-auto h-16 w-16 text-red-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">접근 권한이 없습니다</h2>
          <p className="mt-2 text-base text-gray-600">
            요청하신 페이지에 접근할 권한이 없습니다.
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <div>
            <Link
              to="/"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              홈으로 돌아가기
            </Link>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              문의사항이 있으시면 관리자에게 연락해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized; 
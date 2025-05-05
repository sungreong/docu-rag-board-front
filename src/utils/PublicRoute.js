import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * 인증되지 않은 사용자만 접근할 수 있는 경로 컴포넌트 (로그인 페이지 등)
 * @param {Object} props 
 * @param {JSX.Element} props.children 자식 컴포넌트
 * @param {string} [props.redirectTo='/'] 인증된 사용자 리디렉션 경로
 * @returns {JSX.Element}
 */
function PublicRoute({ children, redirectTo = '/' }) {
  const { isAuthenticated, loading } = useAuth();

  // 인증 상태 로딩 중
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 이미 인증된 사용자는 기본 페이지로 리디렉션
  if (isAuthenticated) {
    return <Navigate to={redirectTo} />;
  }

  // 인증되지 않은 사용자에게 자식 컴포넌트 렌더링
  return children;
}

export default PublicRoute; 
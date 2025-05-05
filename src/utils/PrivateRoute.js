import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * 인증된 사용자만 접근할 수 있는 경로 컴포넌트
 * @param {Object} props 
 * @param {JSX.Element} props.children 보호할 컴포넌트
 * @param {string[]} [props.allowedRoles] 허용된 역할 목록 (없으면 인증된 모든 사용자 허용)
 * @returns {JSX.Element}
 */
function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  // 인증 상태 로딩 중
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // 특정 역할만 허용하는 경우 역할 체크
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  // 인증되고 권한이 있는 경우 자식 컴포넌트 렌더링
  return children;
}

export default PrivateRoute; 
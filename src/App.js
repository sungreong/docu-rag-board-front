import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';

// 페이지 임포트
import HomePage from './pages/HomePage';
import AllDocumentsPage from './pages/AllDocumentsPage';
import AdminPage from './pages/AdminPage';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';
import AuthPage from './pages/AuthPage';
import Unauthorized from './components/Unauthorized';

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // 로딩 중이면 로딩 UI 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  // 관리자 전용 페이지에 일반 사용자가 접근하는 경우 홈으로 리다이렉트
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  // 모든 조건을 통과하면 자식 컴포넌트 렌더링
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/all-documents" element={<AllDocumentsPage />} />
          
          {/* 인증 필요 라우트 */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          
          {/* 문서 업로드 페이지 */}
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          
          {/* 검색 페이지 */}
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            }
          />
          
          {/* 관리자 전용 라우트 */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminPage />
              </ProtectedRoute>
            } 
          />
          
          {/* 권한 없음 페이지 */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* 기타 경로는 홈으로 리디렉션 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

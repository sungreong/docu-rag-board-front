import React, { createContext, useState, useContext, useEffect } from 'react';
import { isAuthenticated, getUserInfo } from '../api/authService';

// 인증 컨텍스트 생성
const AuthContext = createContext(null);

// 컨텍스트 제공자 컴포넌트
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 로컬 스토리지에서 사용자 정보 복원
  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        try {
          // 토큰은 있지만 사용자 정보는 없는 경우, 기본 정보만 설정
          const userInfo = getUserInfo();
          if (userInfo) {
            setUser(userInfo);
          } else {
            setUser({ role: 'user' }); // 기본 역할 설정
          }
        } catch (error) {
          console.error('사용자 정보 복원 오류:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // 로그인 처리
  const login = (userData) => {
    setUser(userData);
    
    // localStorage에 이미 저장되어 있으므로 여기서는 상태만 업데이트
    // authService.js의 login 함수에서 이미 localStorage 처리를 했음
  };

  // 로그아웃 처리
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // 로그아웃 후 추가 처리가 필요하면 여기에 추가
  };

  // 사용자 역할 체크 함수
  const isAdmin = () => {
    return user && (user.role === 'admin' || user.role === 'administrator');
  };

  // 컨텍스트 값 설정
  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 커스텀 훅으로 컨텍스트 사용
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import Register from '../components/Register';
import { useAuth } from '../utils/AuthContext';

function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSuccess = (userData) => {
    // AuthContext에 사용자 정보 설정
    login(userData.user || { email: '', role: 'user' });
    
    // 메인 페이지로 이동
    navigate('/');
  };

  const handleRegisterSuccess = () => {
    // 회원가입 성공 메시지 표시
    setSuccessMessage('회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.');
    
    // 로그인 모드로 전환
    setIsLoginMode(true);
  };

  const toggleMode = () => {
    // 모드 전환 시 메시지 초기화
    setSuccessMessage('');
    setIsLoginMode(!isLoginMode);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {successMessage && (
        <div className="max-w-md mx-auto pt-10 px-4">
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isLoginMode ? (
        <Login 
          onLoginSuccess={handleLoginSuccess}
          onRegisterClick={toggleMode}
        />
      ) : (
        <Register 
          onRegisterSuccess={handleRegisterSuccess}
          onLoginClick={toggleMode}
        />
      )}
    </div>
  );
}

export default AuthPage; 
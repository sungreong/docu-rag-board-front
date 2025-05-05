import apiClient from './client';

// 로그인 API
export const login = async (email, password) => {
  try {
    console.log('로그인 시도:', { email, url: apiClient.defaults.baseURL });
    
    // OAuth2 스펙의 클라이언트 인증 방식 (username/password)
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await apiClient.post('/auth/login', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('로그인 응답:', response.data);

    // 로컬 스토리지에 토큰 저장
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      
      // 관리자 계정 체크 - 이메일로 관리자 판단
      let role = 'user';
      if (email === process.env.REACT_APP_ADMIN_EMAIL) {
        role = 'admin';
      }
      
      // 사용자 정보 구성
      const userInfo = {
        email: email,
        role: role, // 관리자 이메일인 경우 admin 역할 부여
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      return {
        ...response.data,
        user: userInfo
      };
    }

    return response.data;
  } catch (error) {
    console.error('로그인 오류:', error);
    if (error.response) {
      console.error('로그인 응답 오류:', error.response.data);
    }
    throw error;
  }
};

// 회원가입 API
export const signup = async (email, password, name = null, contactEmail = null) => {
  try {
    console.log('회원가입 시도:', { email, url: apiClient.defaults.baseURL });
    
    const response = await apiClient.post('/auth/signup', {
      email,
      password,
      name,
      contact_email: contactEmail
    });
    
    console.log('회원가입 응답:', response.data);
    
    // 회원가입 성공 후 자동 로그인 (선택 사항)
    // 자동 로그인을 원하면 아래 주석을 해제
    // await login(email, password);
    
    return response.data;
  } catch (error) {
    console.error('회원가입 오류:', error);
    if (error.response) {
      console.error('회원가입 응답 오류:', error.response.data);
    }
    throw error;
  }
};

// 로그아웃 (클라이언트 측)
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // 추가적인 로그아웃 로직 (예: 상태 초기화)
};

// 토큰 유효성 검사
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  
  if (!token) return false;
  
  // 실제 구현에서는 JWT 디코딩으로 만료 시간 확인 등 추가 검증 가능
  try {
    // 토큰이 존재하는지만 확인 (간단 구현)
    // JWT 디코딩은 jwt-decode 라이브러리를 사용하면 더 정확함
    return true;
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return false;
  }
};

// 사용자 정보 가져오기 (토큰 기반)
export const getUserInfo = () => {
  try {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  } catch (error) {
    console.error('사용자 정보 로드 오류:', error);
    return null;
  }
}; 
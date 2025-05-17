// 로컬 스토리지에서 토큰을 가져오는 함수
export const getToken = () => {
  return localStorage.getItem('token');
};

// 로컬 스토리지에 토큰을 저장하는 함수
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// 로컬 스토리지에서 토큰을 제거하는 함수
export const removeToken = () => {
  localStorage.removeItem('token');
};

// API 요청에 사용할 인증 헤더를 생성하는 함수
export const getAuthHeader = () => {
  const token = getToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};

// 토큰이 있는지 확인하는 함수
export const isAuthenticated = () => {
  return !!getToken();
};

// 토큰에서 사용자 정보를 추출하는 함수
export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    // JWT 토큰의 payload 부분을 디코딩
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('토큰 디코딩 실패:', error);
    return null;
  }
}; 
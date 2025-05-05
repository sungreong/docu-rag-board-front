import axios from 'axios';

// API 베이스 URL 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001/api';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30초로 타임아웃 시간 증가
});

// 요청 인터셉터 - 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 재시도 카운터 추가
    config.retryCount = config.retryCount || 0;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 401 에러 처리 (인증 만료) 및 재시도 로직
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalConfig = error.config;
    
    // 타임아웃이나 네트워크 에러 발생 시 재시도 (최대 2번)
    if (
      (error.code === 'ECONNABORTED' || !error.response) && 
      originalConfig && 
      originalConfig.retryCount < 2
    ) {
      originalConfig.retryCount += 1;
      
      console.log(`API 요청 재시도 중... (${originalConfig.retryCount}/2)`);
      
      // 지수 백오프 - 재시도마다 대기 시간 증가
      const backoffDelay = originalConfig.retryCount * 2000; // 2초, 4초
      
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      return apiClient(originalConfig);
    }
    
    console.error('API 오류:', error);
    
    if (error.response) {
      const { status } = error.response;
      
      // 인증 만료 시 로그아웃 처리
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 현재 페이지 URL 저장
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          // 로그인 페이지가 아닌 경우에만 리디렉션
          window.location.href = '/login';
        }
      }
      
      // 서버 에러 처리
      if (status >= 500) {
        console.error('서버 오류가 발생했습니다:', error.response.data);
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      console.error('서버 응답 없음:', error.request);
    } else {
      // 요청 설정 과정에서 에러 발생
      console.error('요청 오류:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 
import axios from 'axios';

// 기본 API 인스턴스 설정
const api = axios.create({
  baseURL: 'http://localhost:8001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 인터셉터 설정 (필요시 토큰 추가 등)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API 오류:', error.response || error);
    return Promise.reject(error);
  }
);

// 문서 관련 API
export const documentsApi = {
  // 문서 목록 가져오기
  getDocuments: () => api.get('/documents'),
  
  // 내 문서 목록 가져오기
  getMyDocuments: () => api.get('/documents/my'),
  
  // 문서 업로드
  uploadDocument: (formData) => api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // 문서 수정
  updateDocument: (id, formData) => api.put(`/documents/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // 문서 상세 정보 가져오기
  getDocument: (id) => api.get(`/documents/${id}`),
  
  // 문서 파일 다운로드
  downloadFile: (fileId) => api.get(`/documents/file/${fileId}`, {
    responseType: 'blob',
  }),
};

// 검색 관련 API
export const searchApi = {
  // 키워드 검색
  searchByKeyword: (keyword) => api.get(`/search?keyword=${encodeURIComponent(keyword)}`),
  
  // 상세 검색 (태그, 날짜 등 포함)
  advancedSearch: (params) => api.get('/search/advanced', { params }),
};

// 관리자 기능 API
export const adminApi = {
  // 문서 승인
  approveDocument: (id) => api.put(`/admin/documents/${id}/approve`),
  
  // 문서 거부
  rejectDocument: (id, reason = '') => api.put(`/admin/documents/${id}/reject`, { reason }),
};

export default api; 
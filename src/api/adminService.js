import apiClient from './client';

// 관리자 API 함수들
const adminApi = {
  // 모든 문서 목록 조회
  getAllDocuments: async () => {
    try {
      return await apiClient.get('/admin/documents');
    } catch (error) {
      console.error('모든 문서 조회 오류:', error);
      throw error;
    }
  },

  // 모든 사용자 목록 조회
  getAllUsers: async () => {
    try {
      return await apiClient.get('/admin/users');
    } catch (error) {
      console.error('모든 사용자 조회 오류:', error);
      throw error;
    }
  },

  // 사용자 승인
  approveUser: async (userId) => {
    try {
      return await apiClient.post(`/admin/users/${userId}/approve`);
    } catch (error) {
      console.error('사용자 승인 오류:', error);
      throw error;
    }
  },

  // 사용자 비활성화
  deactivateUser: async (userId) => {
    try {
      return await apiClient.post(`/admin/users/${userId}/deactivate`);
    } catch (error) {
      console.error('사용자 비활성화 오류:', error);
      throw error;
    }
  },

  // 사용자 활성화
  activateUser: async (userId) => {
    try {
      return await apiClient.post(`/admin/users/${userId}/activate`);
    } catch (error) {
      console.error('사용자 활성화 오류:', error);
      throw error;
    }
  },

  // 문서 승인
  approveDocument: async (documentId, onSuccess) => {
    try {
      const response = await apiClient.post(`/admin/documents/${documentId}/approve`);
      
      // 성공 콜백이 있으면 실행
      if (typeof onSuccess === 'function') {
        onSuccess(response.data);
      }
      
      return response;
    } catch (error) {
      console.error('문서 승인 오류:', error);
      throw error;
    }
  },

  // 문서 거부
  rejectDocument: async (documentId, reason = '', onSuccess) => {
    try {
      const response = await apiClient.post(`/admin/documents/${documentId}/reject`, { reason });
      
      // 성공 콜백이 있으면 실행
      if (typeof onSuccess === 'function') {
        onSuccess(response.data);
      }
      
      return response;
    } catch (error) {
      console.error('문서 거부 오류:', error);
      throw error;
    }
  },

  // 문서 삭제
  deleteDocument: async (documentId) => {
    try {
      return await apiClient.delete(`/admin/documents/${documentId}`);
    } catch (error) {
      console.error('문서 삭제 오류:', error);
      throw error;
    }
  },

  // 문서 벡터화
  vectorizeDocument: async (documentId, options = {}) => {
    try {
      let url = `/admin/documents/${documentId}/vectorize`;
      // 옵션에 따라 쿼리 파라미터 추가
      const params = new URLSearchParams();
      if (options.fullVectorize) {
        params.append('full_vectorize', 'true');
      }
      if (options.force) {
        params.append('force', 'true');
      }
      
      // 쿼리 파라미터가 있으면 URL에 추가
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      return await apiClient.post(url);
    } catch (error) {
      console.error('문서 벡터화 오류:', error);
      throw error;
    }
  },

  // 문서 벡터 삭제
  deleteDocumentVector: async (documentId) => {
    try {
      return await apiClient.delete(`/admin/documents/${documentId}/vector`);
    } catch (error) {
      console.error('문서 벡터 삭제 오류:', error);
      throw error;
    }
  },

  // 유효기간 지난 문서 벡터 자동 삭제
  checkDocumentsValidity: async () => {
    try {
      return await apiClient.post('/admin/documents/check-validity');
    } catch (error) {
      console.error('문서 유효기간 체크 오류:', error);
      throw error;
    }
  },

  // 관리자 통계 정보 조회
  getStats: async () => {
    try {
      return await apiClient.get('/admin/stats');
    } catch (error) {
      console.error('관리자 통계 조회 오류:', error);
      throw error;
    }
  }
};

export { adminApi }; 
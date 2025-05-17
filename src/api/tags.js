import apiClient from './client';

export const tagsApi = {
  // =============== 일반 사용자용 태그 API ===============
  
  // 사용 가능한 태그 목록 조회 (검색 및 필터링 지원)
  getAvailableTags: async (params = {}) => {
    try {
      const response = await apiClient.get('/tags/available', { params });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('사용 가능한 태그 조회 실패:', error);
      throw error;
    }
  },

  // 내 태그 목록 조회
  getMyTags: async (params = {}) => {
    try {
      const response = await apiClient.get('/tags/my', { params });
      return response.data;
    } catch (error) {
      console.error('내 태그 조회 실패:', error);
      throw error;
    }
  },

  // 개인 태그 관련
  getPersonalTags: async (params = {}) => {
    try {
      const response = await apiClient.get('/tags/personal', { params });
      return response.data;
    } catch (error) {
      console.error('개인 태그 조회 실패:', error);
      throw error;
    }
  },

  createPersonalTag: async (tagData) => {
    try {
      const response = await apiClient.post('/tags/personal', tagData);
      return response.data;
    } catch (error) {
      console.error('개인 태그 생성 실패:', error);
      throw error;
    }
  },

  updatePersonalTag: async (tagId, tagData) => {
    try {
      const response = await apiClient.put(`/tags/personal/${tagId}`, tagData);
      return response.data;
    } catch (error) {
      console.error('개인 태그 수정 실패:', error);
      throw error;
    }
  },

  deletePersonalTag: async (tagId) => {
    try {
      const response = await apiClient.delete(`/tags/personal/${tagId}`);
      return response.data;
    } catch (error) {
      console.error('개인 태그 삭제 실패:', error);
      throw error;
    }
  },

  // 태그 추가/제거
  addExistingTag: async (tagId) => {
    try {
      const response = await apiClient.post(`/tags/add/${tagId}`);
      return response.data;
    } catch (error) {
      console.error('태그 추가 실패:', error);
      throw error;
    }
  },

  removeTag: async (tagId) => {
    try {
      const response = await apiClient.delete(`/tags/remove/${tagId}`);
      return response.data;
    } catch (error) {
      console.error('태그 제거 실패:', error);
      throw error;
    }
  },

  // 새 태그 생성 후 추가
  createAndAddTag: async (tagData) => {
    try {
      const response = await apiClient.post('/tags/create', tagData);
      return response.data;
    } catch (error) {
      console.error('새 태그 생성 및 추가 실패:', error);
      throw error;
    }
  },

  // 태그 할당량
  getTagQuota: async () => {
    try {
      const response = await apiClient.get('/tags/quota');
      return response.data;
    } catch (error) {
      console.error('태그 할당량 조회 실패:', error);
      throw error;
    }
  },

  // =============== 관리자용 태그 API ===============
  
  // 시스템 태그 관련
  getSystemTags: async (params = {}) => {
    try {
      const response = await apiClient.get('/admin/tags/system', { params });
      return response.data;
    } catch (error) {
      console.error('시스템 태그 조회 실패:', error);
      throw error;
    }
  },

  createSystemTag: async (tagData) => {
    try {
      const response = await apiClient.post('/admin/tags/system', tagData);
      return response.data;
    } catch (error) {
      console.error('시스템 태그 생성 실패:', error);
      throw error;
    }
  },

  updateSystemTag: async (tagId, tagData) => {
    try {
      const response = await apiClient.put(`/admin/tags/system/${tagId}`, tagData);
      return response.data;
    } catch (error) {
      console.error('시스템 태그 수정 실패:', error);
      throw error;
    }
  },

  deleteSystemTag: async (tagId) => {
    try {
      const response = await apiClient.delete(`/admin/tags/system/${tagId}`);
      return response.data;
    } catch (error) {
      console.error('시스템 태그 삭제 실패:', error);
      throw error;
    }
  },

  // 관리자용 태그 할당량 관리
  getUserTagQuota: async (userId) => {
    try {
      const response = await apiClient.get(`/admin/tags/quota/${userId}`);
      return response.data;
    } catch (error) {
      console.error('사용자 태그 할당량 조회 실패:', error);
      throw error;
    }
  },

  updateUserTagQuota: async (userId, quotaData) => {
    try {
      const response = await apiClient.put(`/admin/tags/quota/${userId}`, quotaData);
      return response.data;
    } catch (error) {
      console.error('사용자 태그 할당량 수정 실패:', error);
      throw error;
    }
  }
}; 
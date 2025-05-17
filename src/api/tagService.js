import apiClient from './client';

export const tagsApi = {
  // 개인 태그 목록 조회
  getPersonalTags: async (params) => {
    return await apiClient.get('/tags/personal', { params });
  },

  // 새 개인 태그 생성
  createPersonalTag: async (tagData) => {
    return await apiClient.post('/tags/personal', tagData);
  },

  // 개인 태그 수정
  updatePersonalTag: async (tagId, tagData) => {
    return await apiClient.put(`/tags/personal/${tagId}`, tagData);
  },

  // 개인 태그 삭제
  deletePersonalTag: async (tagId) => {
    return await apiClient.delete(`/tags/personal/${tagId}`);
  },

  // 사용 가능한 모든 태그 조회 (시스템 태그 + 내 태그)
  getAvailableTags: async (params) => {
    return await apiClient.get('/tags/available', { params });
  },

  // 내가 사용 중인 태그 목록 조회
  getMyTags: async (params) => {
    return await apiClient.get('/tags/my', { params });
  },

  // 태그 할당량 조회
  getTagQuota: async () => {
    return await apiClient.get('/tags/quota');
  },

  // 기존 태그를 내 태그로 추가
  addExistingTag: async (tagId) => {
    return await apiClient.post(`/tags/add/${tagId}`);
  },

  // 내 태그에서 제거
  removeTag: async (tagId) => {
    return await apiClient.delete(`/tags/remove/${tagId}`);
  },

  // 새 태그 생성 후 내 태그로 추가
  createAndAddTag: async (tagData) => {
    return await apiClient.post('/tags/create', tagData);
  }
}; 
import apiClient from './client';

// =============== 일반 사용자용 태그 API ===============

// 사용 가능한 태그 목록 조회 (검색 및 필터링 지원)
export const getAvailableTags = async (params = {}) => {
  try {
    const response = await apiClient.get('/tags/available', { params });
    return response.data;
  } catch (error) {
    console.error('사용 가능한 태그 조회 실패:', error);
    throw error;
  }
};

// 내 태그 목록 조회
export const getMyTags = async (params = {}) => {
  try {
    const response = await apiClient.get('/tags/my', { params });
    return response.data;
  } catch (error) {
    console.error('내 태그 조회 실패:', error);
    throw error;
  }
};

// 기존 태그 추가
export const addTag = async (tagId) => {
  try {
    const response = await apiClient.post(`/tags/add/${tagId}`);
    return response.data;
  } catch (error) {
    console.error('태그 추가 실패:', error);
    throw error;
  }
};

// 새 태그 생성 및 추가
export const createAndAddTag = async (tagData) => {
  try {
    const response = await apiClient.post('/tags/create', tagData);
    return response.data;
  } catch (error) {
    console.error('새 태그 생성 및 추가 실패:', error);
    throw error;
  }
};

// 태그 제거
export const removeTag = async (tagId) => {
  try {
    const response = await apiClient.delete(`/tags/remove/${tagId}`);
    return response.data;
  } catch (error) {
    console.error('태그 제거 실패:', error);
    throw error;
  }
};

// 내 태그 할당량 조회
export const getMyTagQuota = async () => {
  try {
    const response = await apiClient.get('/tags/quota');
    return response.data;
  } catch (error) {
    console.error('태그 할당량 조회 실패:', error);
    throw error;
  }
};

// =============== 관리자용 태그 API ===============

// 시스템 태그 목록 조회
export const getSystemTags = async (params = {}) => {
  try {
    const response = await apiClient.get('/admin/tags/system', { params });
    return response.data;
  } catch (error) {
    console.error('시스템 태그 조회 실패:', error);
    throw error;
  }
};

// 사용자 태그 목록 조회
export const getUserTags = async (params = {}) => {
  try {
    const response = await apiClient.get('/admin/tags/user', { params });
    return response.data;
  } catch (error) {
    console.error('사용자 태그 조회 실패:', error);
    throw error;
  }
};

// 모든 태그 목록 조회 (시스템 + 사용자)
export const getAllTags = async (params = {}) => {
  try {
    const [systemTags, userTags] = await Promise.all([
      getSystemTags(params),
      getUserTags(params)
    ]);
    return [...systemTags, ...userTags];
  } catch (error) {
    console.error('전체 태그 조회 실패:', error);
    throw error;
  }
};

// 새로운 시스템 태그 생성
export const createSystemTag = async (tagData) => {
  try {
    const response = await apiClient.post('/admin/tags/system', tagData);
    return response.data;
  } catch (error) {
    console.error('시스템 태그 생성 실패:', error);
    throw error;
  }
};

// 태그 수정
export const updateTag = async (tagId, tagData) => {
  try {
    const response = await apiClient.put(`/admin/tags/system/${tagId}`, tagData);
    return response.data;
  } catch (error) {
    console.error('태그 수정 실패:', error);
    throw error;
  }
};

// 태그 삭제
export const deleteTag = async (tagId) => {
  try {
    const response = await apiClient.delete(`/admin/tags/system/${tagId}`);
    return response.data;
  } catch (error) {
    console.error('태그 삭제 실패:', error);
    throw error;
  }
};

// 사용자별 태그 할당량 조회
export const getTagQuota = async (userId) => {
  try {
    const response = await apiClient.get(`/admin/tags/quota/${userId}`);
    return response.data;
  } catch (error) {
    console.error('태그 할당량 조회 실패:', error);
    throw error;
  }
};

// 사용자별 태그 할당량 수정
export const updateTagQuota = async (userId, quotaData) => {
  try {
    const response = await apiClient.put(`/admin/tags/quota/${userId}`, quotaData);
    return response.data;
  } catch (error) {
    console.error('태그 할당량 수정 실패:', error);
    throw error;
  }
}; 
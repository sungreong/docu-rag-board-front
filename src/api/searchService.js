import apiClient from './client';

// 검색 API 함수들
const searchApi = {
  // 키워드 기반 검색
  searchByKeyword: async (keyword, tags = null, page = 1, limit = 10) => {
    try {
      const params = { keyword, page, limit };
      
      // 태그가 있는 경우 추가
      if (tags && tags.length > 0) {
        params.tags = tags.join(',');
      }
      
      return await apiClient.get('/search', { params });
    } catch (error) {
      console.error('키워드 검색 오류:', error);
      throw error;
    }
  },

  // 벡터 기반 유사 문서 검색
  searchSimilar: async (documentId, limit = 5) => {
    try {
      return await apiClient.get(`/search/similar/${documentId}`, {
        params: { limit }
      });
    } catch (error) {
      console.error('유사 문서 검색 오류:', error);
      throw error;
    }
  },

  // 질문 답변 검색 (RAG 기반)
  searchByQuestion: async (question, documentIds = null) => {
    try {
      const params = { question };
      
      // 특정 문서들에 대해서만 검색하는 경우
      if (documentIds && documentIds.length > 0) {
        params.document_ids = documentIds.join(',');
      }
      
      return await apiClient.get('/search/qa', { params });
    } catch (error) {
      console.error('질문 답변 검색 오류:', error);
      throw error;
    }
  },

  // 인기 태그 목록 조회
  getPopularTags: async (limit = 10) => {
    try {
      return await apiClient.get('/search/tags/popular', {
        params: { limit }
      });
    } catch (error) {
      console.error('인기 태그 조회 오류:', error);
      throw error;
    }
  }
};

export { searchApi }; 
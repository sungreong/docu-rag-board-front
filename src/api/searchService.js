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
  },

  // 패턴 검색 (와일드카드 패턴 사용)
  searchByPattern: async (pattern, filters = {}) => {
    try {
      const params = { 
        pattern,
        ...filters
      };
      
      return await apiClient.get('/search/pattern', { params });
    } catch (error) {
      console.error('패턴 검색 오류:', error);
      throw error;
    }
  },

  // 유사 문서명 검색
  searchBySimilarTitle: async (title, filters = {}) => {
    try {
      const params = { 
        title,
        ...filters
      };
      
      return await apiClient.get('/search/similar-title', { params });
    } catch (error) {
      console.error('유사 문서명 검색 오류:', error);
      throw error;
    }
  },

  // 문서 내용 검색 - 청크 기반 검색
  searchByContent: async (keyword, tags = null, skip = 0, limit = 20) => {
    try {
      const params = { keyword, skip, limit };
      
      // 태그가 있는 경우 추가
      if (tags && tags.length > 0) {
        params.tags = tags.join(',');
      }
      
      return await apiClient.get('/search/content', { params });
    } catch (error) {
      console.error('문서 내용 검색 오류:', error);
      throw error;
    }
  },

  // 통합 문서 검색 (다양한 검색 유형 지원)
  searchDocuments: async (query, filters = {}) => {
    try {
      const { search_type = 'keyword', ...otherFilters } = filters;
      
      // 검색 유형에 따라 다른 API 호출
      switch (search_type) {
        case 'pattern':
          console.log('패턴 검색 실행:', query);
          return await searchApi.searchByPattern(query, otherFilters);
          
        case 'similar':
          console.log('유사 문서명 검색 실행:', query);
          return await searchApi.searchBySimilarTitle(query, otherFilters);
          
        case 'content':
          console.log('문서 내용 검색 실행:', query);
          // 태그는 별도로 처리
          const { tags: contentTags, ...contentFilters } = otherFilters;
          return await searchApi.searchByContent(query, contentTags, contentFilters.skip || 0, contentFilters.limit || 20);
          
        case 'keyword':
        default:
          console.log('키워드 검색 실행:', query);
          // 태그는 별도로 처리
          const { tags, ...restFilters } = otherFilters;
          return await searchApi.searchByKeyword(query, tags, 1, 50);
      }
    } catch (error) {
      console.error('문서 검색 오류:', error);
      throw error;
    }
  }
};

export { searchApi }; 
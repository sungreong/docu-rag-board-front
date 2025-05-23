import apiClient from './client';

// 문서 관리 API 함수들
const documentsApi = {
  // API 기본 URL 가져오기
  getBaseUrl: () => {
    // apiClient의 기본 URL 반환
    // 개발환경이나 프로덕션 환경에 따라 달라질 수 있음
    return apiClient.defaults.baseURL || '';
  },

  // 문서 업로드
  uploadDocument: async (formData) => {
    try {
      console.log('[documentService] 문서 업로드 요청 시작');
      const response = await apiClient.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('[documentService] 문서 업로드 성공 응답:', response.data);
      return response;
    } catch (error) {
      console.error('[documentService] 문서 업로드 오류:', error);
      throw error;
    }
  },

  // 문서 목록 조회
  getDocuments: async (params = {}) => {
    try {
      // 기본 쿼리 파라미터
      const queryParams = new URLSearchParams();
      
      // 페이지네이션
      if (params.skip !== undefined) queryParams.append('skip', params.skip);
      if (params.limit !== undefined) queryParams.append('limit', params.limit);
      
      // 정렬
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      
      // 필터링
      if (params.status) queryParams.append('status', params.status);
      if (params.view_type) queryParams.append('view_type', params.view_type);
      if (params.uploader_id) queryParams.append('uploader_id', params.uploader_id);
      
      // 태그 필터링 (배열인 경우 처리)
      if (params.tags && Array.isArray(params.tags)) {
        params.tags.forEach(tag => {
          queryParams.append('tag', tag);
        });
      } else if (params.tags) {
        queryParams.append('tag', params.tags);
      }
      
      // API 호출
      const url = `/documents?${queryParams.toString()}`;
      console.log('문서 목록 조회 요청 URL:', url);
      const response = await apiClient.get(url);
      console.log('문서 목록 조회 응답:', response.data);
      return response;

    } catch (error) {
      console.error('문서 목록 조회 오류:', error);
      throw error;
    }
  },

  // 내 문서 목록 조회 (view_type=my 사용)
  getMyDocuments: async (params = {}) => {
    return documentsApi.getDocuments({
      ...params,
      view_type: 'my'
    });
  },

  // 공개 문서 목록 조회 (view_type=public 사용)
  getPublicDocuments: async (params = {}) => {
    return documentsApi.getDocuments({
      ...params,
      view_type: 'public'
    });
  },

  // 특정 업로더의 문서 목록 조회
  getUploaderDocuments: async (uploaderId, params = {}) => {
    return documentsApi.getDocuments({
      ...params,
      uploader_id: uploaderId
    });
  },

  // 문서 상세 조회
  getDocument: async (documentId) => {
    try {
      console.log('getDocument 호출됨 - 문서 ID:', documentId, '타입:', typeof documentId);
      
      // 문서 ID가 문자열이 아닌 경우 문자열로 변환
      if (typeof documentId !== 'string') {
        console.warn('문서 ID가 문자열이 아닙니다. 문자열로 변환합니다.');
        documentId = String(documentId);
      }
      
      const response = await apiClient.get(`/documents/${documentId}`);
      console.log('문서 상세 조회 성공 - 응답:', response.data);
      return response;
    } catch (error) {
      console.error('문서 상세 조회 오류:', error, '요청 ID:', documentId);
      throw error;
    }
  },

  // 문서 다운로드
  downloadDocument: async (documentId) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}/download`, {
        responseType: 'json',
      });
      
      // 다운로드 URL 정보 반환
      return response.data;
    } catch (error) {
      console.error('문서 다운로드 URL 조회 오류:', error);
      throw error;
    }
  },
  
  // 특정 파일 다운로드
  downloadDocumentFile: async (documentId, fileName) => {
    try {
      console.log(`파일 다운로드 요청: documentId=${documentId}, fileName=${fileName}`);
      
      // 직접 스트리밍 방식으로 파일 다운로드
      const response = await apiClient.get(`/documents/${documentId}/download/${fileName}`, {
        responseType: 'blob',
      });

      // 파일 다운로드를 위한 임시 링크 생성
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // 임시 요소 정리
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      
      return response;
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      throw error;
    }
  },

  // 문서 업데이트
  updateDocument: async (documentId, formData) => {
    try {
      // FormData에서 기본 필드 추출
      const title = formData.get('title');
      const summary = formData.get('summary');
      const startDate = formData.get('startDate');
      const endDate = formData.get('endDate');
      const tagsStr = formData.get('tags');
      const filesToDeleteStr = formData.get('filesToDelete');
      
      // 먼저 기존 문서 정보 조회
      let existingDocument = {};
      try {
        const docResponse = await apiClient.get(`/documents/${documentId}`);
        existingDocument = docResponse.data;
        console.log('기존 문서 정보:', existingDocument);
      } catch (err) {
        console.warn('기존 문서 정보를 가져오지 못했습니다:', err);
        // 에러가 발생해도 업데이트는 계속 진행
      }
      
      // 업데이트 데이터 구성
      const updateData = {
        ...existingDocument,  // 기존 문서의 모든 필드 유지
        title: title,
        summary: summary,
        start_date: startDate,
        end_date: endDate,
        tags: tagsStr ? JSON.parse(tagsStr) : existingDocument.tags || [],
        status: '승인대기'  // 편집 시 항상 승인대기 상태로 변경
      };
      
      // 파일 삭제 정보 처리
      if (filesToDeleteStr) {
        const filesToDelete = JSON.parse(filesToDeleteStr);
        updateData.files_to_delete = filesToDelete;
        
        // 기존 파일 목록에서 삭제 표시된 파일 제외
        if (existingDocument.file_names) {
          updateData.file_names = existingDocument.file_names.filter(
            name => !filesToDelete.includes(name)
          );
        }
        
        if (existingDocument.fileNames) {
          updateData.fileNames = existingDocument.fileNames.filter(
            name => !filesToDelete.includes(name)
          );
        }
      }
      
      console.log('문서 업데이트 데이터:', updateData);
      
      // API 호출 (Form 데이터와 JSON 데이터 분리)
      // 파일이 있는 경우 multipart/form-data로, 아닌 경우 json으로 전송
      let hasFiles = false;
      for (let pair of formData.entries()) {
        if (pair[0].startsWith('file')) {
          hasFiles = true;
          break;
        }
      }
      
      if (hasFiles) {
        // 파일이 있는 경우 FormData로 전송
        // FormData에 업데이트 데이터 추가
        for (const key in updateData) {
          if (key !== 'title' && key !== 'summary' && key !== 'start_date' && 
              key !== 'end_date' && key !== 'tags' && key !== 'files_to_delete') {
            if (typeof updateData[key] === 'object') {
              formData.append(key, JSON.stringify(updateData[key]));
            } else {
              formData.append(key, updateData[key]);
            }
          }
        }
        
        const response = await apiClient.put(`/documents/${documentId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response;
      } else {
        // 파일이 없는 경우 JSON으로 전송
        const response = await apiClient.put(`/documents/${documentId}`, updateData);
        return response;
      }
    } catch (error) {
      console.error('문서 업데이트 오류:', error);
      throw error;
    }
  },

  // 문서 삭제
  deleteMyDocument: async (documentId) => {
    try {
      return await apiClient.delete(`/documents/${documentId}`);
    } catch (error) {
      console.error('문서 삭제 오류:', error);
      throw error;
    }
  },

  // 일반 사용자용 문서 승인
  approveDocument: async (documentId) => {
    try {
      return await apiClient.post(`/documents/${documentId}/approve`);
    } catch (error) {
      console.error('문서 승인 오류:', error);
      throw error;
    }
  },

  // 일반 사용자용 문서 거부
  rejectDocument: async (documentId, reason = '') => {
    try {
      return await apiClient.post(`/documents/${documentId}/reject`, { reason });
    } catch (error) {
      console.error('문서 거부 오류:', error);
      throw error;
    }
  },

  // 관리자용 문서 영구 삭제
  deleteDocument: async (documentId) => {
    try {
      const response = await apiClient.delete(`/admin/documents/${documentId}`);
      console.log(`문서 ID ${documentId} 삭제 성공`);
      return response.data;
    } catch (error) {
      console.error(`문서 ID ${documentId} 삭제 오류:`, error);
      throw error;
    }
  },

  // 문서 공개/비공개 토글
  togglePublicStatus: async (documentId) => {
    try {
      return await apiClient.post(`/documents/${documentId}/toggle-public`);
    } catch (error) {
      console.error('문서 공개 상태 변경 오류:', error);
      throw error;
    }
  },

  // 파일 업로드 API
  uploadDocumentWithFiles: async (formData, onProgress) => {
    try {
      return await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      throw error;
    }
  },

  // 파일 삭제 API 추가
  deleteDocumentFile: async (documentId, fileName) => {
    try {
      return await apiClient.delete(`/documents/${documentId}/files/${encodeURIComponent(fileName)}`);
    } catch (error) {
      console.error(`파일 ${fileName} 삭제 오류:`, error);
      throw error;
    }
  },

  // 파일 공개/비공개 상태 변경 API 추가
  toggleFileVisibility: async (documentId, fileName, isPublic) => {
    try {
      return await apiClient.post(`/documents/${documentId}/files/${encodeURIComponent(fileName)}/visibility`, {
        is_public: isPublic
      });
    } catch (error) {
      console.error(`파일 ${fileName} 공개 상태 변경 오류:`, error);
      throw error;
    }
  },

  // 파일 상태 조회 API
  getDocumentFilesStatus: async (documentId) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}/files/status`);
      return response.data;
    } catch (error) {
      console.error('파일 상태 조회 오류:', error);
      throw error;
    }
  },

  // 문서 편집 시 추가 파일 업로드 API
  uploadAdditionalFiles: async (documentId, formData) => {
    try {
      console.log(`문서 ID ${documentId}에 추가 파일 업로드 시작`);
      
      // 문서 ID가 formData에 포함되어 있지 않으면 추가
      if (!formData.has('document_id')) {
        formData.append('document_id', documentId);
      }
      
      const response = await apiClient.post(`/documents/${documentId}/files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('추가 파일 업로드 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('추가 파일 업로드 오류:', error);
      throw error;
    }
  },

  // 벡터화 요청 API (일반 사용자용)
  requestVectorizeDocument: async (documentId) => {
    try {
      return await apiClient.post(`/documents/${documentId}/request-vectorize`);
    } catch (error) {
      console.error('벡터화 요청 오류:', error);
      throw error;
    }
  },

  // 벡터 삭제 요청 API (일반 사용자용)
  requestDeleteDocumentVector: async (documentId) => {
    try {
      return await apiClient.post(`/documents/${documentId}/request-delete-vector`);
    } catch (error) {
      console.error('벡터 삭제 요청 오류:', error);
      throw error;
    }
  },

  // 검색 API
  searchDocuments: async (query, filters = {}) => {
    try {
      // 검색 쿼리와 필터 파라미터 구성
      const params = new URLSearchParams({
        query: query,
        ...filters
      });
      
      const response = await apiClient.get(`/documents/search?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('문서 검색 오류:', error);
      throw error;
    }
  },
};

export { documentsApi }; 
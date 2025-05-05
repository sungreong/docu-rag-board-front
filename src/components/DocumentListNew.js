import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { documentsApi } from '../api/documentService';
import { useAuth } from '../utils/AuthContext';

// 로딩 컴포넌트
const Loading = () => (
  <div className="flex justify-center my-8">
    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
);

// 태그 컴포넌트
const Tag = ({ text }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1">
    {text}
  </span>
);

// 문서 상태 뱃지 컴포넌트
const StatusBadge = ({ status }) => {
  let color = 'gray';
  
  switch (status) {
    case '승인완료':
      color = 'green';
      break;
    case '승인대기':
      color = 'yellow';
      break;
    case '반려':
      color = 'red';
      break;
    default:
      color = 'gray';
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
      {status}
    </span>
  );
};

function DocumentListNew({ 
  isAdmin = false,
  onApprove,
  onReject,
  onVectorize,
  onDeleteVector,
  initialViewType,
  initialStatusFilter,
  onListRefresh,
  forceUpdate, // 강제 새로고침 트리거
  onSelectDocument, // 문서 선택 콜백 함수
  selectedDocuments = [] // 선택된 문서 ID 배열
}) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState(initialViewType || 'public');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || '');
  const [tagFilter, setTagFilter] = useState('');
  const [tags, setTags] = useState([]);
  const [uploaderFilter, setUploaderFilter] = useState('');
  const [uploaders, setUploaders] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [fileUrls, setFileUrls] = useState([]);
  const [fileContents, setFileContents] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { user } = useAuth();
  
  // initialViewType과 initialStatusFilter가 변경되면 state 업데이트
  useEffect(() => {
    console.log(`초기 필터 설정: viewType=${initialViewType}, statusFilter=${initialStatusFilter}`);
    if (initialViewType) {
      setViewType(initialViewType);
    }
    if (initialStatusFilter !== undefined) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialViewType, initialStatusFilter]);
  
  // 문서 목록 로드 함수 - useCallback으로 감싸서 불필요한 재생성 방지
  const loadDocuments = useCallback(async () => {
    if (isLoading) {
      console.log('이미 로딩 중입니다. 요청을 건너뜁니다.');
      return;
    }
    
    console.log('DocumentListNew: 문서 목록 로드 시작');
    console.log(`현재 필터: viewType=${viewType}, statusFilter=${statusFilter}`);
    setIsLoading(true);
    setError(null);
    
    try {
      // 필터 파라미터 생성
      const params = {
        view_type: viewType,
      };
      
      if (statusFilter) params.status = statusFilter;
      if (tagFilter) params.tags = [tagFilter];
      if (isAdmin && uploaderFilter) params.uploader_id = uploaderFilter;
      
      console.log('문서 로드 요청 파라미터:', params);
      const response = await documentsApi.getDocuments(params);
      console.log('문서 로드 응답:', response.data.length, '개의 문서');
      
      setDocuments(response.data);
      
      // 태그 목록 추출 (중복 제거)
      const uniqueTags = [...new Set(response.data.flatMap(doc => doc.tags || []))];
      setTags(uniqueTags);
      
      // 업로더 목록 추출 (관리자인 경우만)
      if (isAdmin) {
        const uniqueUploaders = response.data.reduce((acc, doc) => {
          if (doc.uploader_email && !acc.some(u => u.id === doc.user_id)) {
            acc.push({
              id: doc.user_id,
              email: doc.uploader_email,
              name: doc.uploader_name || doc.uploader_email
            });
          }
          return acc;
        }, []);
        setUploaders(uniqueUploaders);
      }
      
      // 마지막 새로고침 시간 업데이트
      setLastRefreshed(new Date());
      
      // 부모 컴포넌트에 새로고침을 알림 (필요한 경우)
      if (onListRefresh) {
        onListRefresh();
      }
    } catch (err) {
      console.error('문서 로드 오류:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
      } else if (!err.response) {
        setError('서버 연결에 실패했습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError('문서 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [viewType, statusFilter, tagFilter, uploaderFilter, isAdmin, onListRefresh]);

  // 통합된 useEffect: 컴포넌트 마운트 시와 필터 변경, forceUpdate 변경 시 데이터 로드
  useEffect(() => {
    // loadDocuments 자체가 의존성에 있으면 무한 루프가 발생할 수 있으므로 제거
    // 대신 필터 변경과 forceUpdate가 트리거 역할을 함
    console.log('DocumentListNew: 데이터 로드 트리거 - 마운트/필터변경/강제새로고침');
    loadDocuments();
  }, [viewType, statusFilter, tagFilter, uploaderFilter, forceUpdate]); // loadDocuments 의존성 제거

  // 문서 공개/비공개 토글
  const handleTogglePublicStatus = async (docId) => {
    try {
      await documentsApi.togglePublicStatus(docId);
      loadDocuments(); // 문서 목록 다시 로드
      if (previewDoc && previewDoc.id === docId) {
        // 현재 미리보기 중인 문서의 공개 상태가 변경된 경우 미리보기 새로고침
        handleOpenPreview(docId);
      }
      alert('문서 공개 상태가 변경되었습니다.');
    } catch (error) {
      console.error('문서 공개 상태 변경 오류:', error);
      alert('문서 공개 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 관리자 기능: 승인
  const handleApprove = async (docId) => {
    if (!onApprove) return;
    
    try {
      await onApprove(docId);
      // 승인 후 지연 시간을 두고 문서 목록만 새로고침
      setTimeout(() => {
        loadDocuments();
      }, 500);
    } catch (error) {
      console.error(`문서 ID ${docId} 승인 처리 오류:`, error);
      setError('문서 승인 중 오류가 발생했습니다.');
    }
  };

  // 관리자 기능: 거부
  const handleReject = async (docId) => {
    if (!onReject) return;
    
    try {
      await onReject(docId);
      // 거부 후 지연 시간을 두고 문서 목록만 새로고침
      setTimeout(() => {
        loadDocuments();
      }, 500);
    } catch (error) {
      console.error(`문서 ID ${docId} 거부 처리 오류:`, error);
      setError('문서 거부 중 오류가 발생했습니다.');
    }
  };

  // 미리보기에서 승인
  const handleApproveFromPreview = async () => {
    if (!previewDoc || !onApprove) return;
    
    try {
      await onApprove(previewDoc.id);
      handleClosePreview();
      // 승인 후 지연 시간을 두고 문서 목록만 새로고침
      setTimeout(() => {
        loadDocuments();
      }, 500);
    } catch (error) {
      console.error('미리보기에서 승인 오류:', error);
      setError('문서 승인 중 오류가 발생했습니다.');
    }
  };

  // 미리보기에서 거부
  const handleRejectFromPreview = async () => {
    if (!previewDoc || !onReject) return;
    
    try {
      await onReject(previewDoc.id);
      handleClosePreview();
      // 거부 후 지연 시간을 두고 문서 목록만 새로고침
      setTimeout(() => {
        loadDocuments();
      }, 500);
    } catch (error) {
      console.error('미리보기에서 거부 오류:', error);
      setError('문서 거부 중 오류가 발생했습니다.');
    }
  };

  // 문서 미리보기 열기
  const handleOpenPreview = async (docId) => {
    setPreviewDoc(null);
    setIsPreviewLoading(true);
    setPreviewError(null);
    setFileUrls([]);
    
    try {
      // 문서 상세 정보 가져오기
      const response = await documentsApi.getDocument(docId);
      console.log('문서 미리보기 응답:', response.data);
      setPreviewDoc(response.data);
      
      // 파일 URL 가져오기
      if (response.data.file_names && response.data.file_names.length > 0) {
        const downloadResponse = await documentsApi.downloadDocument(docId);
        console.log('다운로드 URL 응답:', downloadResponse);
        setFileUrls(downloadResponse.download_urls || []);
      }
    } catch (error) {
      console.error('문서 미리보기 로드 오류:', error);
      setPreviewError('문서 내용을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // 파일 유형에 따른 아이콘 선택
  const getFileIcon = (fileName) => {
    if (!fileName) return null;
    
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) {
      return (
        <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (['doc', 'docx'].includes(extension)) {
      return (
        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return (
        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (['ppt', 'pptx'].includes(extension)) {
      return (
        <svg className="h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
      return (
        <svg className="h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
  };

  // 파일 다운로드 처리 함수
  const handleFileDownload = async (e, url, fileName) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (previewDoc && previewDoc.id) {
        console.log(`파일 다운로드: ${previewDoc.id}/${fileName}`);
        await documentsApi.downloadDocumentFile(previewDoc.id, fileName);
      } else {
        console.error('문서 ID가 없어 파일을 다운로드할 수 없습니다.');
        alert('파일 다운로드에 실패했습니다: 문서 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('파일 다운로드 중 오류가 발생했습니다:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  // 미리보기 모달 닫기
  const handleClosePreview = () => {
    setPreviewDoc(null);
    setFileUrls([]);
  };
  
  // 지정된 링크로 새 창 열기 (개발 중)
  const openInNewTab = (url, docId, fileName) => {
    // 개발 중인 기능 알림
    alert('새 창 열기 기능은 현재 개발 중입니다.');
  };

  // formatDate 함수 정의 (필요한 경우)
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('날짜 형식 변환 오류:', e);
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 필터 옵션 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* 보기 유형 선택 */}
          <div className="flex space-x-2">
            {/* 관리자는 모든 보기 옵션 표시 */}
            {isAdmin && (
              <button
                onClick={() => setViewType('all')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  viewType === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                전체 문서
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setViewType('public')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                viewType === 'public'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              공개 문서
            </button>
            )}
            
            <button
              onClick={() => setViewType('my')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                viewType === 'my'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              내 문서
            </button>
          </div>

          {/* 상태 필터 */}
          <div className="flex items-center">
            <label htmlFor="status-filter" className="mr-2 text-sm font-medium text-gray-700">
              상태:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                statusFilter === '승인대기' ? 'bg-yellow-50 font-medium' : ''
              }`}
            >
              <option value="">전체</option>
              <option value="승인완료">승인완료</option>
              <option value="승인대기">승인대기</option>
              <option value="반려">반려</option>
            </select>
            {statusFilter && (
              <span className="ml-2 text-xs text-gray-600">
                {statusFilter === '승인대기' 
                  ? '승인 대기 문서만 표시 중' 
                  : `${statusFilter} 문서만 표시 중`}
              </span>
            )}
          </div>

          {/* 태그 필터 */}
          <div className="flex items-center">
            <label htmlFor="tag-filter" className="mr-2 text-sm font-medium text-gray-700">
              태그:
            </label>
            <select
              id="tag-filter"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* 업로더 필터 (관리자만) */}
          {isAdmin && (
            <div className="flex items-center">
              <label htmlFor="uploader-filter" className="mr-2 text-sm font-medium text-gray-700">
                업로더:
              </label>
              <select
                id="uploader-filter"
                value={uploaderFilter}
                onChange={(e) => setUploaderFilter(e.target.value)}
                className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">전체</option>
                {uploaders.map((uploader) => (
                  <option key={uploader.id} value={uploader.id}>
                    {uploader.name || uploader.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 새로고침 버튼만 유지 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={loadDocuments}
              className="inline-flex items-center px-2 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isLoading}
              aria-label="문서 목록 새로고침"
              title="문서 목록 새로고침"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span className="ml-1">새로고침</span>
            </button>
            <span className="text-xs text-gray-500">
              {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 로딩 상태 - 애니메이션 복원 */}
      {isLoading ? (
        <Loading />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* 체크박스 열 추가 */}
                {onSelectDocument && (
                  <th scope="col" className="relative w-12 px-6 py-3">
                    <span className="sr-only">선택</span>
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  태그
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  업로더
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등록일
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  공개여부
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    문서가 없습니다.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className={`cursor-pointer hover:bg-gray-50 ${selectedDoc === doc.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleOpenPreview(doc.id)}
                  >
                    {/* 체크박스 열 추가 */}
                    {onSelectDocument && (
                      <td 
                        className="relative w-12 px-6 py-4 whitespace-nowrap" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="absolute h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectedDocuments.includes(doc.id)}
                          onChange={(e) => onSelectDocument(doc.id, e.target.checked)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                        <div className="flex flex-wrap mt-1">
                          {doc.tags && doc.tags.map((tag, index) => (
                            <span key={index} className="mr-1 mb-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(doc.created_at)}</div>
                      {doc.uploader_name && (
                        <div className="text-xs text-gray-400 mt-1">{doc.uploader_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doc.status === '승인완료' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.status}
                        </span>
                        
                        {/* 공개/비공개 상태 표시 추가 */}
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doc.is_public ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.is_public ? '공개' : '비공개'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.uploader_name || doc.uploader_email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.is_public ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          공개
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          비공개
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {/* 문서 소유자만 공개 설정 변경 가능 */}
                        {doc.user_id === user?.id && (
                          <>
                            <button
                              onClick={() => handleTogglePublicStatus(doc.id)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs"
                            >
                              {doc.is_public ? '비공개로 전환' : '공개로 전환'}
                            </button>
                            
                            <Link
                              to={`/documents/edit/${doc.id}`}
                              className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs"
                            >
                              수정
                            </Link>
                          </>
                        )}

                        {/* 관리자에게만 보이는 버튼들 */}
                        {isAdmin && (
                          <>
                            {/* 관리자도 문서 소유자가 아니면 편집/공개 설정 가능 */}
                            {doc.user_id !== user?.id && (
                              <>
                                <button
                                  onClick={() => handleTogglePublicStatus(doc.id)}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs"
                                >
                                  {doc.is_public ? '비공개로 전환' : '공개로 전환'}
                                </button>
                                
                                <Link
                                  to={`/documents/edit/${doc.id}`}
                                  className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs"
                                >
                                  수정
                                </Link>
                              </>
                            )}

                            {/* 승인 대기 문서만 승인/거부 버튼 표시 */}
                            {doc.status === '승인대기' && (
                              <>
                                <button
                                  onClick={() => handleApprove(doc.id)}
                                  className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs"
                                  title="이 문서를 승인합니다"
                                >
                                  승인
                                </button>
                                
                                <button
                                  onClick={() => handleReject(doc.id)}
                                  className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs"
                                  title="이 문서를 거부합니다"
                                >
                                  거부
                                </button>
                              </>
                            )}
                            
                            {/* 승인된 문서만 벡터화 관련 버튼 표시 */}
                            {doc.status === '승인완료' && (
                              <>
                                {!doc.vectorized ? (
                                  <button
                                    onClick={() => onVectorize(doc.id)}
                                    className="text-purple-600 hover:text-purple-900 bg-purple-50 px-2 py-1 rounded text-xs"
                                    title="이 문서를 벡터 검색에 활용할 수 있도록 벡터화합니다"
                                  >
                                    벡터화
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => onDeleteVector(doc.id)}
                                    className="text-orange-600 hover:text-orange-900 bg-orange-50 px-2 py-1 rounded text-xs"
                                    title="이 문서의 벡터를 삭제합니다"
                                  >
                                    벡터 삭제
                                  </button>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 문서 미리보기 모달 - 애니메이션 복원 */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                문서 미리보기: {previewDoc.title}
              </h3>
              <button
                onClick={handleClosePreview}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 모달 본문 */}
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              {isPreviewLoading ? (
                <div className="flex justify-center my-8">
                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : previewError ? (
                <div className="p-4 bg-red-50 border-l-4 border-red-500">
                  <p className="text-sm text-red-700">{previewError}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 문서 정보 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">상태</p>
                        <StatusBadge status={previewDoc.status} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">등록일</p>
                        <p className="text-sm text-gray-900">{formatDate(previewDoc.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">업로더</p>
                        <p className="text-sm text-gray-900">{previewDoc.uploader_name || previewDoc.uploader_email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">공개여부</p>
                        <div className="flex items-center">
                          {previewDoc.is_public ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">공개</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">비공개</span>
                          )}
                          <button
                            onClick={() => handleTogglePublicStatus(previewDoc.id)}
                            className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            {previewDoc.is_public ? '비공개로 전환' : '공개로 전환'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 태그 */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">태그</p>
                    <div className="flex flex-wrap gap-2">
                      {previewDoc.tags && previewDoc.tags.length > 0 ? (
                        previewDoc.tags.map((tag) => (
                          <Tag key={tag} text={tag} />
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">태그 없음</span>
                      )}
                    </div>
                  </div>
                  
                  {/* 요약 */}
                  {previewDoc.summary && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">요약</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{previewDoc.summary}</p>
                    </div>
                  )}
                  
                  {/* 첨부 파일 */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">첨부 파일</p>
                    {previewDoc.file_names && previewDoc.file_names.length > 0 ? (
                      <ul className="divide-y divide-gray-200 border rounded-lg overflow-hidden">
                        {previewDoc.file_names.map((fileName, index) => (
                          <li key={fileName} className="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
                            <div className="flex items-center">
                              {getFileIcon(fileName)}
                              <span className="ml-2 text-sm font-medium text-gray-700">{fileName}</span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => handleFileDownload(e, null, fileName)}
                                className="flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                다운로드
                              </button>
                              <button
                                onClick={() => openInNewTab(null, previewDoc.id, fileName)}
                                className="flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors opacity-70 cursor-help"
                                title="개발 중인 기능입니다"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                새 창 (개발 중)
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm italic py-2 px-3 bg-gray-50 rounded">첨부 파일이 없습니다.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* 공개/비공개 상태 관리 섹션 */}
            <div className="px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {previewDoc.is_public 
                    ? '이 문서는 현재 공개 상태입니다. 모든 사용자가 검색하고 볼 수 있습니다.'
                    : '이 문서는 현재 비공개 상태입니다. 관리자와 작성자만 볼 수 있습니다.'}
                </div>
                <button
                  onClick={() => handleTogglePublicStatus(previewDoc.id)}
                  className={`px-4 py-2 text-sm font-medium rounded ${
                    previewDoc.is_public
                      ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {previewDoc.is_public ? '비공개로 전환' : '공개로 전환'}
                </button>
              </div>
            </div>
            
            {/* 모달 푸터 - 승인/거부 버튼 */}
            {isAdmin && previewDoc?.status === '승인대기' && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={handleRejectFromPreview}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  disabled={isPreviewLoading}
                >
                  거부
                </button>
                <button
                  onClick={handleApproveFromPreview}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                  disabled={isPreviewLoading}
                >
                  승인
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentListNew; 
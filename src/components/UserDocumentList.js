import React, { useState, useEffect, useRef } from 'react';
import { documentService, adminService } from '../api';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import DocumentEditForm from './DocumentEditForm';

function DocumentList({ 
  documents = [], 
  onRefresh, 
  isLoading, 
  isAdmin = false, 
  onApprove, 
  onReject, 
  onVectorize,
  onDeleteVector,
  onUpdateDocument
}) {
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedDoc, setExpandedDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', '승인완료', '승인대기'
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [showAction, setShowAction] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    summary: '',
    tags: [],
    start_date: '',
    end_date: '',
    is_public: false
  });
  const [fileStatuses, setFileStatuses] = useState({});  // 파일 상태 정보 추가
  const [loadingFileStatuses, setLoadingFileStatuses] = useState(false);

  // 마크다운 미리보기 상태 추가
  const [previewMode, setPreviewMode] = useState(false);

  const { user } = useAuth();

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return '날짜 없음';
    
    try {
      // 다양한 날짜 포맷 처리 시도
      let date;
      
      // ISO 형식(T 포함)이나 DB 형식
      if (typeof dateString === 'string') {
        // 일반 날짜 문자열(YYYY-MM-DD)이고 -가 포함되어 있으면
        if (dateString.includes('-') && !dateString.includes('T') && !dateString.includes(':')) {
          const parts = dateString.split('-');
          if (parts.length === 3) {
            // year, month(0-indexed), day
            date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            date = new Date(dateString);
          }
        } else {
          // ISO 형식이나 다른 형식일 경우 기본 Date 생성자 사용
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }
      
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        console.warn('잘못된 날짜 형식:', dateString);
        return '날짜 형식 오류';
      }
      
      // 한국 시간대 기준으로 표시
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('날짜 변환 오류:', error, dateString);
      return '날짜 형식 오류';
    }
  };

  // 정렬 함수
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // 필터링 함수
  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1); // 필터 변경 시 1페이지로 리셋
  };

  // 페이지 변경 함수
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 아이템 표시 개수 변경 함수
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // 페이지당 아이템 수 변경 시 1페이지로 리셋
  };

  // 문서 선택 처리
  const handleSelectDocument = (docId) => {
    setSelectedDocs(prev => {
      if (prev.includes(docId)) {
        return prev.filter(id => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedDocs.length === currentItems.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(currentItems.map(doc => doc.id));
    }
  };

  // 선택된 문서들 벡터화
  const handleVectorizeSelected = async () => {
    if (!selectedDocs.length) return;
    
    // 유효기간을 확인하여 만료된 문서가 있는지 체크
    const invalidDocs = currentItems
      .filter(doc => selectedDocs.includes(doc.id))
      .filter(doc => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isExpired = doc.end_date && new Date(doc.end_date) < today;
        const notStarted = doc.start_date && new Date(doc.start_date) > today;
        return isExpired || notStarted;
      });
    
    // 만료된 문서가 있으면 경고
    if (invalidDocs.length > 0) {
      const forceVectorize = window.confirm(
        `선택한 문서 중 ${invalidDocs.length}개가 유효기간을 벗어났습니다.\n` +
        `(만료되었거나 아직 시작되지 않은 문서)\n\n` +
        `이러한 문서는 검색 결과에 포함되지 않을 수 있습니다.\n` +
        `계속 진행하시겠습니까?`
      );
      
      if (!forceVectorize) return;
    }
    
    try {
      // 선택된 모든 문서에 대해 벡터화 요청
      await Promise.all(selectedDocs.map(docId => {
        const doc = currentItems.find(d => d.id === docId);
        const isInvalid = invalidDocs.some(d => d.id === docId);
        
        // 만료된 문서는 force 옵션 추가
        return onVectorize(docId, { force: isInvalid });
      }));
      
      // 완료 후 선택 초기화 및 목록 새로고침
      setSelectedDocs([]);
      onRefresh();
      alert('선택한 문서들의 벡터화가 요청되었습니다.');
    } catch (error) {
      console.error('문서 벡터화 오류:', error);
      alert('문서 벡터화 중 오류가 발생했습니다.');
    }
  };

  // 선택된 문서들 벡터 삭제
  const handleDeleteVectorsSelected = async () => {
    if (!selectedDocs.length) return;
    
    try {
      // 선택된 모든 문서에 대해 벡터 삭제 요청
      await Promise.all(selectedDocs.map(docId => onDeleteVector(docId)));
      // 완료 후 선택 초기화 및 목록 새로고침
      setSelectedDocs([]);
      onRefresh();
      alert('선택한 문서들의 벡터가 삭제되었습니다.');
    } catch (error) {
      console.error('문서 벡터 삭제 오류:', error);
      alert('문서 벡터 삭제 중 오류가 발생했습니다.');
    }
  };

  // 선택된 문서들 승인
  const handleApproveSelected = async () => {
    if (!selectedDocs.length) return;
    
    if (!window.confirm(`선택한 ${selectedDocs.length}개의 문서를 모두 승인하시겠습니까?`)) {
      return;
    }
    
    try {
      // 선택된 모든 문서에 대해 승인 요청
      await Promise.all(selectedDocs.map(docId => onApprove(docId)));
      
      // 완료 후 선택 초기화 및 목록 새로고침
      setSelectedDocs([]);
      onRefresh();
      alert('선택한 문서들이 성공적으로 승인되었습니다.');
    } catch (error) {
      console.error('문서 승인 오류:', error);
      alert('문서 승인 중 오류가 발생했습니다.');
    }
  };

  // 선택된 문서들 거절
  const handleRejectSelected = async () => {
    if (!selectedDocs.length) return;
    
    const reason = prompt(`선택한 ${selectedDocs.length}개의 문서를 모두 거절하시겠습니까?\n\n거절 사유 (선택사항):`, '');
    if (reason === null) return; // 사용자가 취소한 경우
    
    try {
      // 선택된 모든 문서에 대해 거절 요청
      await Promise.all(selectedDocs.map(docId => onReject(docId, reason)));
      
      // 완료 후 선택 초기화 및 목록 새로고침
      setSelectedDocs([]);
      onRefresh();
      alert('선택한 문서들이 거절되었습니다.');
    } catch (error) {
      console.error('문서 거절 오류:', error);
      alert('문서 거절 중 오류가 발생했습니다.');
    }
  };

  // 선택된 문서 삭제 처리 함수
  const handleDeleteSelected = async () => {
    if (!selectedDocs.length) return;
    
    // 사용자 확인 (경고 메시지 표시)
    if (!window.confirm(`선택한 ${selectedDocs.length}개의 문서를 영구적으로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 모든 관련 파일과 벡터 데이터도 함께 삭제됩니다.`)) {
      return;
    }
    
    // 버튼 참조 및 원래 텍스트 저장
    const deleteBtn = document.getElementById("deleteSelectedBtn");
    let originalButtonText = deleteBtn ? deleteBtn.innerHTML : "";
    
    try {
      // 로딩 상태 표시 (삭제 버튼 변경)
      if (deleteBtn) {
        deleteBtn.innerHTML = '<svg class="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 삭제 중...';
      }
      
      // 선택된 모든 문서에 대해 순차적으로 삭제 요청
      for (const docId of selectedDocs) {
        await documentService.deleteDocument(docId);
      }
      
      // 완료 후 선택 초기화 및 목록 새로고침
      setSelectedDocs([]);
      onRefresh();
      alert('선택한 문서들이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('문서 삭제 오류:', error);
      alert(`문서 삭제 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      // 버튼 상태 복원 (에러가 발생해도)
      if (deleteBtn && originalButtonText) {
        deleteBtn.innerHTML = originalButtonText;
      }
    }
  };

  // 필터링된 문서 배열
  const filteredDocuments = documents.filter(doc => {
    if (filterStatus === 'all') return true;
    return doc.status === filterStatus;
  });

  // 정렬된 문서 목록
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let valueA = a[sortBy];
    let valueB = b[sortBy];

    // 날짜값 처리
    if (sortBy === 'created_at' || sortBy === 'start_date' || sortBy === 'end_date') {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }

    // 문자열 처리
    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // 페이지네이션 로직
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedDocuments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);
  console.log(currentItems);
  // 페이지 범위 계산 (최대 5페이지 표시)
  const pageRange = 5;
  let startPage = Math.max(1, currentPage - Math.floor(pageRange / 2));
  let endPage = startPage + pageRange - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - pageRange + 1);
  }

  // 페이지 버튼 생성
  const pageButtons = [];
  for (let i = startPage; i <= endPage; i++) {
    pageButtons.push(
      <button
        key={i}
        onClick={() => handlePageChange(i)}
        className={`px-3 py-1 mx-1 rounded ${
          currentPage === i
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        {i}
      </button>
    );
  }

  // 문서 만료 여부 확인
  const isExpired = (endDate) => {
    if (!endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(endDate) < today;
  };

  // 유효 상태에 따른 배지 스타일
  const getValidityBadgeStyle = (startDate, endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isExpired(endDate)) {
      return 'bg-red-100 text-red-800'; // 만료됨
    }
    
    if (startDate && new Date(startDate) > today) {
      return 'bg-yellow-100 text-yellow-800'; // 아직 시작 안됨
    }
    
    return 'bg-green-100 text-green-800'; // 현재 유효함
  };
  
  // 유효 상태 텍스트
  const getValidityText = (startDate, endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isExpired(endDate)) {
      return '만료됨';
    }
    
    if (startDate && new Date(startDate) > today) {
      return '예정됨';
    }
    
    return '유효함';
  };

  // 문서 상세보기 토글
  const toggleDocumentDetail = async (docId) => {
    if (expandedDoc === docId) {
      setExpandedDoc(null);
    } else {
      setExpandedDoc(docId);
      
      // 파일 상태 정보 조회
      await loadFileStatuses(docId);
    }
  };
  
  // 파일 상태 로드 함수 추가
  const loadFileStatuses = async (docId) => {
    setLoadingFileStatuses(true);
    try {
      const response = await documentService.getDocumentFilesStatus(docId);
      
      // 파일명을 키로 하는 객체로 변환
      const statusMap = {};
      response.forEach(fileStatus => {
        statusMap[fileStatus.original_filename] = fileStatus;
      });
      
      setFileStatuses(prev => ({
        ...prev,
        [docId]: statusMap
      }));
    } catch (error) {
      console.error('파일 상태 조회 오류:', error);
    } finally {
      setLoadingFileStatuses(false);
    }
  };

  // 문서 수정 시작
  const handleEditDocument = async (doc) => {
    setEditingDoc(doc);
    
    // 파일 상태 로드
    await loadFileStatuses(doc.id);
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingDoc(null);
  };

  // 문서 수정 후 저장
  const handleSaveEdit = async (editData, additionalFiles) => {
    if (!editingDoc) return;
    
    try {
      // 기본 문서 정보 업데이트
      await onUpdateDocument(editingDoc.id, editData);
      
      // 새 파일 업로드 (추가된 파일이 있는 경우)
      if (additionalFiles && additionalFiles.length > 0) {
        const formData = new FormData();
        
        // 문서 ID 추가
        formData.append('document_id', editingDoc.id);
        
        // 추가 파일 업로드
        additionalFiles.forEach(file => {
          formData.append('files', file);
        });
        
        // 파일 업로드 API 호출
        await documentService.uploadAdditionalFiles(editingDoc.id, formData);
      }
      
      // 수정 모드 종료 및 목록 새로고침
      setEditingDoc(null);
      onRefresh();
      alert('문서가 성공적으로 수정되었습니다. 승인 대기 상태로 변경되었습니다.');
    } catch (error) {
      console.error('문서 수정 오류:', error);
      alert('문서 수정 중 오류가 발생했습니다.');
    }
  };

  // 파일 다운로드 처리 함수
  const handleFileDownload = async (e, docId, fileName) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await documentService.downloadDocumentFile(docId, fileName);
    } catch (error) {
      console.error('파일 다운로드 중 오류가 발생했습니다:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  // 파일 삭제 처리 함수 추가
  const handleFileDelete = async (e, docId, fileName) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 삭제 확인
    if (!window.confirm(`"${fileName}" 파일을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    
    try {
      // 백엔드 API 호출
      await documentService.deleteDocumentFile(docId, fileName);
      alert('파일이 성공적으로 삭제되었습니다.');
      onRefresh(); // 목록 새로고침
    } catch (error) {
      console.error('파일 삭제 중 오류가 발생했습니다:', error);
      alert('파일 삭제에 실패했습니다.');
    }
  };

  // 파일 공개/비공개 토글 함수 추가
  const handleFileVisibilityToggle = async (e, docId, fileName, isPublic) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // 백엔드 API 호출
      await documentService.toggleFileVisibility(docId, fileName, !isPublic);
      alert(`파일이 ${!isPublic ? '공개' : '비공개'}로 설정되었습니다.`);
      onRefresh(); // 목록 새로고침
    } catch (error) {
      console.error('파일 공개 상태 변경 중 오류가 발생했습니다:', error);
      alert('파일 공개 상태 변경에 실패했습니다.');
    }
  };

  // 문서 유효성 상태에 따른 벡터화 버튼 렌더링
  const renderVectorizeButton = (doc) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isExpired = doc.end_date && new Date(doc.end_date) < today;
    const notStarted = doc.start_date && new Date(doc.start_date) > today;
    const isInvalid = isExpired || notStarted;
    
    if (doc.vectorized) {
      return (
        <button 
          onClick={() => onDeleteVector(doc.id)}
          className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center"
        >
          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          벡터 삭제
        </button>
      );
    } else {
      return (
        <button 
          onClick={() => {
            if (isInvalid) {
              if (window.confirm(
                '이 문서는 유효기간을 벗어났습니다.\n' +
                '(만료되었거나 아직 시작되지 않음)\n\n' +
                '이러한 문서는 검색 결과에 포함되지 않을 수 있습니다.\n' +
                '계속 진행하시겠습니까?'
              )) {
                onVectorize(doc.id, { force: true });
              }
            } else {
              onVectorize(doc.id);
            }
          }}
          className={`px-3 py-1.5 text-xs rounded-md ${
            isInvalid 
              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          } transition-colors flex items-center`}
        >
          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          {isInvalid ? '유효기간 경고' : '벡터화'}
        </button>
      );
    }
  };

  // 문서 공개/비공개 토글
  const handleTogglePublicStatus = async (docId) => {
    try {
      await documentService.togglePublicStatus(docId);
      onRefresh();
      alert('문서 공개 상태가 변경되었습니다.');
    } catch (error) {
      console.error('문서 공개 상태 변경 오류:', error);
      alert('문서 공개 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 문서 목록 로드 시 콘솔에 문서 상태 출력 (디버깅용)
  useEffect(() => {
    if (documents && documents.length > 0) {
      console.log('문서 목록 로드됨:', documents);
      // 첨부 파일 확인
      documents.forEach(doc => {
        if (doc.file_names && doc.file_names.length > 0) {
          console.log(`문서 ${doc.id} 파일:`, doc.file_names);
        }
        // 벡터 상태 확인
        console.log(`문서 ${doc.id} 벡터화 상태:`, doc.vectorized);
      });
    }
  }, [documents]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 sm:px-6 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold text-gray-800">문서 목록</h2>
        <div className="flex items-center">
          {isAdmin && selectedDocs.length > 0 && (
            <div className="flex mr-4 space-x-2">
              <button
                id="deleteSelectedBtn"
                onClick={handleDeleteSelected}
                className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                문서 삭제
              </button>
              <button
                onClick={handleApproveSelected}
                className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                문서 승인
              </button>
              <button
                onClick={handleRejectSelected}
                className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                문서 거절
              </button>
              <button
                onClick={handleVectorizeSelected}
                className="px-3 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                문서 벡터화
              </button>
              <button
                onClick={handleDeleteVectorsSelected}
                className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                문서 벡터데이터 삭제
              </button>
            </div>
          )}
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">
              {selectedDocs.length > 0 && `${selectedDocs.length}개 선택됨`}
            </span>
            <button 
              onClick={onRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 focus:outline-none"
              disabled={isLoading}
              aria-label="새로고침"
            >
              <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* 필터링 및 정렬 컨트롤 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 상태 필터 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">상태:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1 text-sm rounded ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => handleFilterChange('승인완료')}
                className={`px-3 py-1 text-sm rounded ${
                  filterStatus === '승인완료'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                승인완료
              </button>
              <button
                onClick={() => handleFilterChange('승인대기')}
                className={`px-3 py-1 text-sm rounded ${
                  filterStatus === '승인대기'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                승인대기
              </button>
            </div>
          </div>
          
          {/* 정렬 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">정렬:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="p-1.5 text-sm border border-gray-300 rounded bg-white"
            >
              <option value="created_at-desc">등록일 (최신순)</option>
              <option value="created_at-asc">등록일 (오래된순)</option>
              <option value="title-asc">제목 (가나다순)</option>
              <option value="title-desc">제목 (역순)</option>
              <option value="end_date-asc">종료일 (빠른순)</option>
              <option value="end_date-desc">종료일 (늦은순)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 로딩 중 */}
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">문서 목록을 불러오는 중...</p>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex justify-center items-center p-12 border-t">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">문서가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">새 문서를 등록해 보세요.</p>
          </div>
        </div>
      ) : sortedDocuments.length === 0 ? (
        <div className="flex justify-center items-center p-12 border-t">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">검색 결과가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">필터 조건을 변경해 보세요.</p>
          </div>
        </div>
      ) : (
        <>
          {/* 문서 목록 */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isAdmin && (
                    <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={selectedDocs.length === currentItems.length && currentItems.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      제목
                      {sortBy === 'title' && (
                        <svg className={`w-4 h-4 ml-1 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      등록일
                      {sortBy === 'created_at' && (
                        <svg className={`w-4 h-4 ml-1 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    파일
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleDocumentDetail(doc.id)}>
                    {isAdmin && (
                      <td className="px-2 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          checked={selectedDocs.includes(doc.id)}
                          onChange={() => handleSelectDocument(doc.id)}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.status === '승인완료' ? (
                        <span className="px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          승인완료
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          승인대기
                        </span>
                      )}
                      
                      {/* 공개/비공개 상태 표시 */}
                      <div className="mt-1">
                        {doc.is_public ? (
                          <span className="px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            공개
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                            </svg>
                            비공개
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.file_names && doc.file_names.length > 0 ? (
                        <span className="text-sm text-gray-700">파일 {doc.file_names.length}개</span>
                      ) : (
                        <span className="text-sm text-gray-500">없음</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-row space-x-2 justify-center">
                        {/* 수정 버튼 */}
                        <button 
                          onClick={() => handleEditDocument(doc)}
                          className="p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          title="수정"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        {/* 승인 버튼 (관리자만) */}
                        {isAdmin && doc.status !== '승인완료' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('이 문서를 승인하시겠습니까?')) {
                                onApprove(doc.id);
                              }
                            }}
                            className="p-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                            title="승인"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        
                        {/* 거절 버튼 (관리자만) */}
                        {isAdmin && doc.status !== '승인대기' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const reason = prompt('거절 사유를 입력해주세요 (선택사항):', '');
                              if (reason !== null) {
                                onReject(doc.id, reason);
                              }
                            }}
                            className="p-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                            title="거절"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 페이지네이션 컨트롤 */}
          <div className="px-6 py-3 flex flex-wrap items-center justify-between bg-gray-50 border-t">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                {documents.length}개 중 {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, documents.length)}개 표시
              </span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="p-1 text-sm border border-gray-300 rounded"
              >
                <option value={5}>5개씩</option>
                <option value={10}>10개씩</option>
                <option value={25}>25개씩</option>
                <option value={50}>50개씩</option>
              </select>
            </div>
            
            <div className="flex mt-2 sm:mt-0">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`px-2 py-1 mx-1 rounded ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="sr-only">처음</span>
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-2 py-1 mx-1 rounded ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="sr-only">이전</span>
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {pageButtons}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-2 py-1 mx-1 rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="sr-only">다음</span>
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-2 py-1 mx-1 rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="sr-only">마지막</span>
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* 수정 폼 모달 */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <DocumentEditForm 
            document={editingDoc}
            fileStatuses={fileStatuses[editingDoc.id] || {}}
            loadingFileStatuses={loadingFileStatuses}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
            onFileDownload={handleFileDownload}
            onFileDelete={handleFileDelete}
            onFileVisibilityToggle={handleFileVisibilityToggle}
          />
        </div>
      )}
    </div>
  );
}

export default DocumentList; 
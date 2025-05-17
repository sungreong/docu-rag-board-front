import React, { useState, useRef, useEffect } from 'react';
import { documentService } from '../api';
import { tagsApi } from '../api/tags';

function EditDocument({ document, onEditSuccess, onCancel }) {
  const [title, setTitle] = useState(document?.title || '');
  const [summary, setSummary] = useState(document?.summary || '');
  const [tags, setTags] = useState(document?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(document?.startDate || '');
  const [endDate, setEndDate] = useState(document?.endDate || '');
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});
  const [validityInfo, setValidityInfo] = useState({
    isStartDateValid: true,
    isEndDateValid: true,
    durationDays: 0,
    durationText: '',
    isPastEnd: false
  });
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [vectorDbWarningShown, setVectorDbWarningShown] = useState(false);
  const [contentChanged, setContentChanged] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  
  const fileInputRef = useRef(null);
  const tagInputRef = useRef(null);

  // 시스템 태그 로드
  useEffect(() => {
    const loadSystemTags = async () => {
      try {
        const response = await tagsApi.getSystemTags();
        setSuggestedTags(response.map(tag => tag.name));
      } catch (error) {
        console.error('시스템 태그 로드 실패:', error);
      }
    };
    
    loadSystemTags();
  }, []);

  // 내용 변경 감지
  useEffect(() => {
    if (document) {
      const titleChanged = title !== document.title;
      const summaryChanged = summary !== document.summary;
      const tagsChanged = JSON.stringify(tags.sort()) !== JSON.stringify((document.tags || []).sort());
      const startDateChanged = startDate !== document.startDate;
      const endDateChanged = endDate !== document.endDate;
      
      const hasChanges = titleChanged || summaryChanged || tagsChanged || 
                          startDateChanged || endDateChanged || files.length > 0;
      
      setContentChanged(hasChanges);
      
      // 내용이 변경되었고 아직 경고를 보여주지 않았다면 벡터 DB 경고 표시
      if (hasChanges && !vectorDbWarningShown && document.vectorized) {
        setVectorDbWarningShown(true);
      }
    }
  }, [title, summary, tags, startDate, endDate, files, document, vectorDbWarningShown]);

  // 기존 문서 정보 로드 개선
  useEffect(() => {
    if (document) {
      console.log('문서 정보 로드:', document);
      console.log('문서 ID:', getDocumentId());
      
      setTitle(document.title || '');
      setSummary(document.summary || '');
      setTags(document.tags || []);
      
      // 날짜 필드 처리 개선 - 다양한 필드명 지원
      let startDateValue = '';
      let endDateValue = '';
      
      // startDate 또는 start_date 중 존재하는 값 사용
      if (document.startDate) {
        startDateValue = document.startDate;
      } else if (document.start_date) {
        startDateValue = document.start_date;
      }
      
      // endDate 또는 end_date 중 존재하는 값 사용
      if (document.endDate) {
        endDateValue = document.endDate;
      } else if (document.end_date) {
        endDateValue = document.end_date;
      }
      
      // ISO 형식이면 YYYY-MM-DD 형식으로 변환
      if (startDateValue && startDateValue.includes('T')) {
        startDateValue = startDateValue.split('T')[0];
      }
      
      if (endDateValue && endDateValue.includes('T')) {
        endDateValue = endDateValue.split('T')[0];
      }
      
      console.log('설정할 날짜 - 시작:', startDateValue, '종료:', endDateValue);
      
      setStartDate(startDateValue);
      setEndDate(endDateValue);
      
      // 파일 정보 로드
      console.log('파일 목록:', getFileNames());
    }
  }, [document]);

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  // 파일 삭제 핸들러
  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // 태그 입력 처리
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  // 태그 추가
  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  // 엔터 키로 태그 추가
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  // 태그 클릭으로 추가
  const handleSuggestedTagClick = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  // 태그 삭제
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 드래그 이벤트 핸들러
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // 드롭 이벤트 핸들러
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  // 날짜 유효성 및 기간 계산
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validity = {
      isStartDateValid: true,
      isEndDateValid: true,
      durationDays: 0,
      durationText: '',
      isPastEnd: false
    };
    
    if (startDate) {
      const startDateObj = new Date(startDate);
      validity.isStartDateValid = startDateObj >= today;
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      validity.isEndDateValid = endDateObj >= today;
      validity.isPastEnd = !validity.isEndDateValid;
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // 유효 기간 계산 (밀리초 -> 일)
      const diffTime = Math.abs(end - start);
      validity.durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1은 당일 포함
      
      if (validity.durationDays === 1) {
        validity.durationText = '하루';
      } else {
        validity.durationText = `${validity.durationDays}일`;
      }
    }
    
    setValidityInfo(validity);
  }, [startDate, endDate]);

  // 유효기간 빠른 선택 헬퍼 함수 추가
  const setDurationMonths = (months) => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + months);
    
    // YYYY-MM-DD 형식으로 변환
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setStartDate(formatDate(today));
    setEndDate(formatDate(endDate));
  };

  // 업로드 폼 검증
  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    }
    
    if (!summary.trim()) {
      newErrors.summary = '요약 내용을 입력해주세요';
    }
    
    if (!startDate) {
      newErrors.startDate = '시작일을 입력해주세요';
    }
    
    if (!endDate) {
      newErrors.endDate = '종료일을 입력해주세요';
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.dates = '종료일은 시작일 이후여야 합니다';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 문서 유효기간 확인
  const checkDocumentValidity = () => {
    if (!endDate) return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작으로 설정
    
    const docEndDate = new Date(endDate);
    
    return docEndDate >= today;
  };

  // 기존 파일 삭제 처리 함수 추가
  const handleMarkFileForDeletion = (fileName) => {
    setFilesToDelete(prev => [...prev, fileName]);
  };

  // 삭제 표시 취소 함수
  const handleUnmarkFileForDeletion = (fileName) => {
    setFilesToDelete(prev => prev.filter(name => name !== fileName));
  };

  // 파일 이름 변수를 가져오는 함수 추가
  const getFileNames = () => {
    if (document?.fileNames && Array.isArray(document.fileNames) && document.fileNames.length > 0) {
      return document.fileNames;
    } 
    if (document?.file_names && Array.isArray(document.file_names) && document.file_names.length > 0) {
      return document.file_names;
    }
    return [];
  };

  // 문서 아이디 추출 함수 추가
  const getDocumentId = () => {
    if (!document) return null;
    
    // id 필드가 있는 경우
    if (document.id) return String(document.id);
    
    // _id 필드가 있는 경우 (몽고DB 형식)
    if (document._id) return String(document._id);
    
    console.warn('문서에 ID 정보를 찾을 수 없습니다:', document);
    return null;
  };

  // 폼 제출 핸들러 수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const documentId = getDocumentId();
    if (!documentId) {
      alert('문서 ID를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
      return;
    }
    
    // 문서의 종료일이 현재 날짜보다 이전인지 확인
    if (!checkDocumentValidity()) {
      const isConfirmed = window.confirm('설정한 종료일이 이미 지났습니다. 이 문서는 검색에 표시되지 않을 수 있습니다. 계속 진행하시겠습니까?');
      if (!isConfirmed) {
        return;
      }
    }
    
    // 벡터화된 문서인 경우 재처리 경고
    if (document.vectorized && contentChanged) {
      const isConfirmed = window.confirm(
        '문서 내용이 변경되었습니다. 수정 후에는 관리자가 다시 벡터 DB에 추가해야 검색에 활용됩니다. 계속 진행하시겠습니까?'
      );
      if (!isConfirmed) {
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // FormData 생성 - 필드명 일치시키기
      const formData = new FormData();
      formData.append('title', title);
      formData.append('summary', summary);
      formData.append('start_date', startDate); // 서버 API와 필드명 일치
      formData.append('end_date', endDate);     // 서버 API와 필드명 일치
      formData.append('tags', JSON.stringify(tags));
      
      // 디버깅 정보 (개발 중에만 필요)
      console.log('문서 ID:', documentId);
      console.log('제목:', title);
      console.log('내용:', summary);
      console.log('시작일:', startDate);
      console.log('종료일:', endDate);
      console.log('태그:', tags);

      // 삭제할 파일 정보 추가
      if (filesToDelete.length > 0) {
        formData.append('files_to_delete', JSON.stringify(filesToDelete)); // 서버 API와 필드명 일치
        console.log('삭제할 파일:', filesToDelete);
      }
      
      // 파일 추가
      if (files.length > 0) {
        console.log('추가할 파일:', files.map(f => f.name));
        files.forEach((file, index) => {
          formData.append(`files`, file); // 서버 API와 필드명 일치
        });
      }
      
      try {
        // 백엔드 API 호출
        const response = await documentService.updateDocument(documentId, formData);
        console.log('문서 업데이트 성공:', response);
        onEditSuccess(response.data);
        
        // 성공 알림
        alert('문서가 수정되었습니다.');
      } catch (error) {
        console.error('백엔드 API 오류:', error);
        
        // 백엔드 연결 실패 시 모의 응답 생성
        const mockResponse = {
          ...document,
          id: documentId,
          title,
          summary,
          tags,
          start_date: startDate,
          end_date: endDate,
          vectorized: document.vectorized && !contentChanged
        };
        
        // 삭제 표시된 파일 제거
        if (mockResponse.fileNames) {
          mockResponse.fileNames = mockResponse.fileNames.filter(name => !filesToDelete.includes(name));
        }
        
        if (mockResponse.file_names) {
          mockResponse.file_names = mockResponse.file_names.filter(name => !filesToDelete.includes(name));
        }
        
        onEditSuccess(mockResponse);
        
        // 성공 알림
        alert('문서가 수정되었습니다. (백엔드 연결 실패로 모의 데이터 사용)');
      }
    } catch (error) {
      console.error('문서 수정 오류:', error);
      alert('문서 수정 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 파일 다운로드 함수 수정
  const handleFileDownload = async (fileName) => {
    const documentId = getDocumentId();
    
    if (!documentId || !fileName) {
      alert('파일 정보가 올바르지 않습니다.');
      return;
    }
    
    try {
      console.log(`파일 다운로드 요청: ${documentId}/${fileName}`);
      
      try {
        // API를 통한 파일 다운로드
        await documentService.downloadDocumentFile(documentId, fileName);
        console.log('파일 다운로드 성공');
      } catch (error) {
        console.error('파일 다운로드 오류:', error);
        alert('파일 다운로드 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('파일 다운로드 처리 오류:', error);
      alert('파일 다운로드 처리 중 오류가 발생했습니다.');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="w-full">
        {/* 벡터화 경고 */}
        {document.vectorized && contentChanged && (
          <div className="mb-4 p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">벡터 DB 재처리 필요</h3>
                <div className="mt-1 text-sm text-yellow-700">
                  <p>문서 내용이 변경되었습니다. 수정 후에는 관리자가 다시 벡터 DB에 추가해야 검색에 활용됩니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* 왼쪽 섹션: 제목, 태그, 유효기간, 파일첨부 */}
          <div className="lg:w-1/2 space-y-5">
            {/* 제목 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                제목 *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full p-2 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="문서 제목을 입력하세요"
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
            </div>
            
            {/* 태그 */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                태그
              </label>
              <div className="mb-2 flex flex-wrap gap-1">
                {tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="ml-1.5 text-blue-500 hover:text-blue-700 focus:outline-none"
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex">
                <input
                  type="text"
                  id="tagInput"
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagKeyDown}
                  className="w-full p-2 border border-gray-300 rounded-l-md"
                  placeholder="태그 입력 후 엔터 (쉼표로 구분)"
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-700 hover:bg-gray-200"
                >
                  추가
                </button>
              </div>
              
              {/* 추천 태그 */}
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">추천 태그:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedTags
                    .filter(tag => !tags.includes(tag))
                    .slice(0, 10)
                    .map((tag, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestedTagClick(tag)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
                      >
                        + {tag}
                      </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 유효기간 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  문서 유효기간 *
                </label>
                {startDate && endDate && !errors.dates && (
                  <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded">
                    {validityInfo.durationText} 동안 유효
                  </span>
                )}
              </div>
              
              {/* 빠른 기간 선택 버튼 추가 */}
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-1">빠른 기간 설정:</div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 6, 12].map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setDurationMonths(months)}
                      className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                    >
                      {months}개월
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    시작일 *
                    {startDate && !validityInfo.isStartDateValid && (
                      <span className="ml-2 text-xs font-normal text-red-600">
                        (지난 날짜)
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full p-2 border rounded-md ${errors.startDate || errors.dates ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    종료일 *
                    {endDate && !validityInfo.isEndDateValid && (
                      <span className="ml-2 text-xs font-normal text-red-600">
                        (지난 날짜)
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    min={startDate || today}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full p-2 border rounded-md ${errors.endDate || errors.dates ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
                </div>
              </div>
              {errors.dates && <p className="mt-1 text-sm text-red-500">{errors.dates}</p>}
            </div>
            
            {/* 파일 첨부 */}
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                추가 파일 첨부
              </label>
              
              <div 
                className={`border-2 ${dragActive ? 'border-blue-500' : 'border-gray-300'} ${errors.files ? 'border-red-500' : ''} border-dashed rounded-md p-4 text-center`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
                
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  
                  <div className="text-sm text-gray-600">
                    <p>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="text-blue-600 hover:underline focus:outline-none"
                      >
                        파일 선택
                      </button>
                      {' '}또는 파일을 여기에 끌어다 놓으세요
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOCX, XLSX, PPTX, TXT 파일 등 가능
                    </p>
                  </div>
                </div>
              </div>
              
              {errors.files && <p className="mt-1 text-sm text-red-500">{errors.files}</p>}
              
              {/* 첨부된 새 파일 목록 */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">새로 첨부된 파일:</h4>
                  <ul className="border rounded-md divide-y divide-gray-200 overflow-hidden">
                    {files.map((file, index) => (
                      <li key={index} className="pl-3 pr-4 py-2 flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-gray-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{file.name}</span>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <button 
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-600 hover:text-red-800 focus:outline-none"
                          >
                            삭제
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 기존 파일 목록 */}
              {getFileNames().length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">기존 첨부 파일:</h4>
                  <ul className="border rounded-md divide-y divide-gray-200 overflow-hidden">
                    {getFileNames().map((fileName, index) => {
                      const isMarkedForDeletion = filesToDelete.includes(fileName);
                      return (
                        <li key={index} className={`pl-3 pr-4 py-2 flex items-center justify-between text-sm ${isMarkedForDeletion ? 'bg-red-50' : ''}`}>
                          <div className="flex items-center">
                            <svg className={`h-5 w-5 mr-3 ${isMarkedForDeletion ? 'text-red-400' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className={`truncate ${isMarkedForDeletion ? 'line-through text-gray-400' : ''}`}>{fileName}</span>
                          </div>
                          <div className="ml-4 flex-shrink-0 space-x-2">
                            {isMarkedForDeletion ? (
                              <button 
                                type="button"
                                onClick={() => handleUnmarkFileForDeletion(fileName)}
                                className="text-blue-600 hover:text-blue-800 focus:outline-none"
                              >
                                취소
                              </button>
                            ) : (
                              <>
                                <button 
                                  type="button"
                                  className="text-blue-600 hover:text-blue-800 focus:outline-none"
                                  onClick={() => handleFileDownload(fileName)}
                                >
                                  다운로드
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleMarkFileForDeletion(fileName)}
                                  className="text-red-600 hover:text-red-800 focus:outline-none"
                                >
                                  삭제
                                </button>
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {filesToDelete.length > 0 && (
                    <p className="text-sm text-red-500 mt-2">
                      {filesToDelete.length}개 파일이 삭제 예정입니다. 문서 저장 시 영구 삭제됩니다.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* 오른쪽 섹션: 내용 (마크다운 지원) */}
          <div className="lg:w-1/2 space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                  요약 내용 *
                </label>
                <button
                  type="button"
                  onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showMarkdownPreview ? '편집 모드' : '미리보기'}
                </button>
              </div>
              
              {!showMarkdownPreview ? (
                <textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className={`w-full p-3 border rounded-md ${errors.summary ? 'border-red-500' : 'border-gray-300'} h-96`}
                  placeholder="문서 내용을 요약해서 입력하세요. 마크다운 형식을 지원합니다."
                ></textarea>
              ) : (
                <div className="w-full p-3 border rounded-md border-gray-300 h-96 overflow-y-auto bg-gray-50">
                  <div className="prose prose-sm max-w-none">
                    {/* 마크다운 렌더링 */}
                    <div dangerouslySetInnerHTML={{ __html: summary }} />
                  </div>
                </div>
              )}
              
              {errors.summary && <p className="mt-1 text-sm text-red-500">{errors.summary}</p>}
              
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  마크다운 문법을 지원합니다. (# 제목, **굵게**, *기울임*, 리스트, 링크 등)
                </p>
              </div>
            </div>
            
            {/* 버튼 그룹 */}
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>처리 중...</span>
                  </span>
                ) : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default EditDocument; 
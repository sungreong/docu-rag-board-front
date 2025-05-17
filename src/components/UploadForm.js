import React, { useState, useRef, useEffect } from 'react';
import { documentService } from '../api';
import TaskProgress from './TaskProgress';
import FileUploadStatus from './FileUploadStatus';
import { tagsApi } from '../api/tags';

function UploadForm({ onUploadSuccess }) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
  const [taskId, setTaskId] = useState(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedDocumentId, setUploadedDocumentId] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  
  const fileInputRef = useRef(null);
  const tagInputRef = useRef(null);

  // 사용 가능한 모든 태그 로드 (시스템 태그 + 개인 태그)
  useEffect(() => {
    const loadAvailableTags = async () => {
      try {
        const response = await tagsApi.getAvailableTags({
          skip: 0,
          limit: 100
        });
        setSuggestedTags(response.map(tag => ({
          name: tag.name,
          color: tag.color,
          description: tag.description
        })));
      } catch (error) {
        console.error('태그 로드 실패:', error);
      }
    };
    
    loadAvailableTags();
  }, []);

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

  // 태그 선택 핸들러
  const handleTagSelect = (tag) => {
    if (!selectedTags.some(t => t.name === tag.name)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // 태그 제거 핸들러
  const handleTagRemove = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag.name !== tagToRemove.name));
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

  // 업로드 폼 검증
  const validateForm = () => {
    const newErrors = {};
    
    if (title.trim() === '') {
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

  // 개선된 마크다운 렌더링 함수
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    // 처리 전 텍스트 준비 (공백 라인 정규화)
    text = text.replace(/\r\n/g, '\n');
    
    // HTML 이스케이프 함수
    const escapeHtml = (unsafe) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };
    
    // 먼저 코드 블록을 추출하여 보호 (임시 토큰으로 교체)
    const codeBlocks = [];
    const inlineCodeBlocks = [];
    
    // 코드 블록 (```) 처리
    text = text.replace(/```([\s\S]*?)```/g, (match, codeContent) => {
      const token = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(escapeHtml(codeContent.trim()));
      return token;
    });
    
    // 인라인 코드 (`) 처리
    text = text.replace(/`([^`\n]+)`/g, (match, codeContent) => {
      const token = `__INLINE_CODE_${inlineCodeBlocks.length}__`;
      inlineCodeBlocks.push(escapeHtml(codeContent));
      return token;
    });
    
    // 줄 단위로 텍스트 처리
    const lines = text.split('\n');
    const processedLines = [];
    let inList = false;
    let listType = null;
    let listItems = [];
    
    lines.forEach((line, index) => {
      // 헤더 처리 (# 제목)
      if (line.match(/^#{1,6}\s/)) {
        // 이전 목록 처리 완료
        if (inList) {
          processedLines.push(renderList(listItems, listType));
          inList = false;
          listItems = [];
        }
        
        const headerLevel = line.match(/^(#{1,6})\s/)[1].length;
        const headerText = line.replace(/^#{1,6}\s+/, '');
        const fontSizeClass = headerLevel === 1 ? 'text-2xl' : 
                             headerLevel === 2 ? 'text-xl' : 
                             headerLevel === 3 ? 'text-lg' : 
                             headerLevel === 4 ? 'text-base' : 
                             headerLevel === 5 ? 'text-sm' : 'text-xs';
                             
        processedLines.push(`<h${headerLevel} class="${fontSizeClass} font-bold my-${Math.max(4 - headerLevel, 1)}">${headerText}</h${headerLevel}>`);
      }
      // 순서 없는 목록 (*, -, +)
      else if (line.match(/^\s*[-*+]\s/)) {
        if (!inList || listType !== 'ul') {
          // 이전 목록 처리 완료
          if (inList) {
            processedLines.push(renderList(listItems, listType));
            listItems = [];
          }
          inList = true;
          listType = 'ul';
        }
        const itemText = line.replace(/^\s*[-*+]\s+/, '');
        listItems.push(itemText);
      }
      // 순서 있는 목록 (1. 항목)
      else if (line.match(/^\s*\d+\.\s/)) {
        if (!inList || listType !== 'ol') {
          // 이전 목록 처리 완료
          if (inList) {
            processedLines.push(renderList(listItems, listType));
            listItems = [];
          }
          inList = true;
          listType = 'ol';
        }
        const itemText = line.replace(/^\s*\d+\.\s+/, '');
        listItems.push(itemText);
      }
      // 빈 줄
      else if (line.trim() === '') {
        // 목록 처리 완료
        if (inList) {
          processedLines.push(renderList(listItems, listType));
          inList = false;
          listItems = [];
        }
        processedLines.push('<br>');
      }
      // 일반 텍스트
      else {
        // 목록 처리 완료
        if (inList) {
          processedLines.push(renderList(listItems, listType));
          inList = false;
          listItems = [];
        }
        // 인라인 마크다운 처리
        let processedLine = line;
        
        // 굵게 (**text**)
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // 기울임 (*text*)
        processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 링크 ([text](url))
        processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
          '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
        
        processedLines.push(processedLine);
      }
    });
    
    // 마지막 목록 처리
    if (inList) {
      processedLines.push(renderList(listItems, listType));
    }
    
    // 목록 렌더링 보조 함수
    function renderList(items, type) {
      const tagName = type === 'ul' ? 'ul' : 'ol';
      const className = type === 'ul' ? 'list-disc' : 'list-decimal';
      
      const listItems = items.map(item => `<li>${item}</li>`).join('');
      return `<${tagName} class="${className} ml-5 my-2">${listItems}</${tagName}>`;
    }
    
    // 모든 줄 연결
    let html = processedLines.join('\n');
    
    // 연속된 <br> 처리 (하나만 남기기)
    html = html.replace(/<br>\s*<br>/g, '<br>');
    
    // 문단으로 감싸기
    html = html.replace(/([^<>]+)(?=<)/g, '<p class="my-2">$1</p>');
    
    // 빈 문단 제거
    html = html.replace(/<p class="my-2"><\/p>/g, '');
    
    // 코드 블록 복원
    codeBlocks.forEach((code, index) => {
      html = html.replace(`__CODE_BLOCK_${index}__`, 
        `<pre class="bg-gray-100 p-3 rounded my-2 overflow-x-auto"><code>${code}</code></pre>`);
    });
    
    // 인라인 코드 복원
    inlineCodeBlocks.forEach((code, index) => {
      html = html.replace(`__INLINE_CODE_${index}__`, 
        `<code class="bg-gray-100 px-1 rounded text-sm font-mono">${code}</code>`);
    });
    
    return html;
  };

  // 유효기간 설정 부분 수정 
  // 날짜 설정 헬퍼 함수 추가
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

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // 문서의 종료일이 현재 날짜보다 이전인지 확인
    if (!checkDocumentValidity()) {
      const isConfirmed = window.confirm('설정한 종료일이 이미 지났습니다. 이 문서는 검색에 표시되지 않을 수 있습니다. 계속 진행하시겠습니까?');
      if (!isConfirmed) {
        return;
      }
    }
    
    setIsUploading(true);
    setTaskId(null);
    setUploadComplete(false);
    setUploadedDocumentId(null);
    
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('title', title);
      formData.append('summary', summary);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('tags', JSON.stringify(selectedTags.map(tag => tag.name)));
      formData.append('is_public', isPublic.toString());
      
      // 파일 추가 - 일관된 이름으로 변경
      console.log('[UploadForm] 업로드할 파일:', files);
      files.forEach((file) => {
        formData.append('files', file); // 모든 파일을 'files' 이름으로 추가
      });
      
      try {
        // 백엔드 API 호출
        const response = await documentService.uploadDocument(formData);
        console.log('[UploadForm] 업로드 응답:', response);
        
        // 응답 데이터 처리
        const responseData = response.data;
        console.log('[UploadForm] 응답 데이터:', responseData);
        
        // 작업 ID와 문서 ID가 있는 경우 상태에 저장
        if (responseData) {
          if (responseData.task_id) {
            console.log('[UploadForm] 작업 ID 설정:', responseData.task_id);
            setTaskId(responseData.task_id);
          } else {
            console.warn('[UploadForm] 응답에 task_id가 없습니다');
          }
          
          if (responseData.id) {
            console.log('[UploadForm] 문서 ID 설정:', responseData.id);
            setUploadedDocumentId(responseData.id);
          } else {
            console.warn('[UploadForm] 응답에 id가 없습니다');
          }
        }
        
        setUploadComplete(true);
        
        // 업로드 완료 시 콜백 호출
        if (onUploadSuccess) {
          console.log('[UploadForm] onUploadSuccess 콜백 호출');
          onUploadSuccess(responseData);
        }
        
      } catch (error) {
        console.error('[UploadForm] 백엔드 API 오류:', error);
        
        // 오류 메시지 처리
        let errorMessage = '업로드 중 오류가 발생했습니다.';
        if (error.response && error.response.data && error.response.data.detail) {
          errorMessage = `오류: ${error.response.data.detail}`;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('[UploadForm] 업로드 오류:', error);
      alert('업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  // 작업 완료 핸들러
  const handleTaskComplete = (result) => {
    // 폼 초기화
    setTitle('');
    setSummary('');
    setTags([]);
    setTagInput('');
    setFiles([]);
    setStartDate('');
    setEndDate('');
    setIsPublic(true);
    setErrors({});
    setTaskId(null);
    
    // 사용자에게 작업 완료 알림
    alert('문서가 성공적으로 업로드되고 처리되었습니다. 관리자 승인 후 검색 가능합니다.');
  };

  // 파일 상태 확인 완료 핸들러
  const handleFilesStatusComplete = (filesStatus) => {
    const completedCount = filesStatus.filter(f => f.processing_status === 'completed').length;
    const failedCount = filesStatus.filter(f => f.processing_status === 'failed').length;
    
    if (failedCount === 0 && completedCount === filesStatus.length) {
      // 모든 파일이 성공적으로 처리됨
      // 폼 초기화
      setTitle('');
      setSummary('');
      setTags([]);
      setTagInput('');
      setFiles([]);
      setStartDate('');
      setEndDate('');
      setIsPublic(true);
      setErrors({});
      setTaskId(null);
      setUploadedDocumentId(null);
      
      alert('모든 파일이 성공적으로 업로드되었습니다. 관리자 승인 후 검색 가능합니다.');
    } else if (failedCount > 0) {
      // 일부 파일 처리 실패
      alert(`${filesStatus.length}개 파일 중 ${completedCount}개가 업로드되었습니다. ${failedCount}개 파일은 업로드 실패했습니다.`);
    }
  };

  // 작업 오류 핸들러
  const handleTaskError = (error) => {
    console.error('문서 처리 오류:', error);
    alert(`문서 처리 중 오류가 발생했습니다: ${error}`);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="w-full">
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
            
            {/* 공개/비공개 설정 */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                문서 공개 설정
              </label>
              <div className="flex items-center">
                <div 
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ease-in-out duration-200 ${
                    isPublic ? 'bg-blue-600' : 'bg-gray-300'
                  } cursor-pointer`}
                  onClick={() => setIsPublic(!isPublic)}
                >
                  <span
                    className={`inline-block w-4 h-4 transform transition ease-in-out duration-200 rounded-full bg-white ${
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {isPublic ? '공개' : '비공개'}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  {isPublic 
                    ? '(다른 사용자가 검색과 조회가 가능합니다)' 
                    : '(나만 볼 수 있는 문서로 설정됩니다)'}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {isPublic 
                  ? '공개 문서는 관리자 승인 후 모든 사용자가 검색 결과에서 볼 수 있습니다.' 
                  : '비공개 문서는 본인만 조회 가능하며, 검색 결과에 표시되지 않습니다.'}
              </p>
            </div>
            
            {/* 태그 선택 영역 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그 선택
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map(tag => (
                  <div
                    key={tag.name}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                    style={{ backgroundColor: tag.color, color: '#ffffff' }}
                  >
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="hover:text-gray-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="border rounded-md p-2">
                <div className="text-sm font-medium mb-2">추천 태그:</div>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map(tag => (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => handleTagSelect(tag)}
                      className="px-2 py-1 rounded-full text-sm text-white"
                      style={{ backgroundColor: tag.color }}
                      title={tag.description || tag.name}
                    >
                      {tag.name}
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
                    className={`w-full p-2 border rounded-md ${
                      errors.startDate ? 'border-red-500' : 
                      (startDate && !validityInfo.isStartDateValid ? 'border-orange-300 bg-orange-50' : 'border-gray-300')
                    }`}
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
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full p-2 border rounded-md ${
                      errors.endDate ? 'border-red-500' : 
                      (endDate && !validityInfo.isEndDateValid ? 'border-red-300 bg-red-50' : 'border-gray-300')
                    }`}
                  />
                  {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
                </div>
              </div>
              {errors.dates && <p className="mt-1 text-sm text-red-500">{errors.dates}</p>}
              
              {/* 유효기간 안내 메시지 */}
              <div className={`mt-2 p-3 rounded-md text-sm ${
                validityInfo.isPastEnd ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-700'
              }`}>
                {validityInfo.isPastEnd ? (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-1.5 mt-0.5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      <strong>종료일이 이미 지났습니다.</strong> 이 문서는 검색 결과에 표시되지 않습니다.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-1.5 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      <strong>문서 유효기간 안내:</strong> 시작일부터 종료일까지만 검색 결과에 표시됩니다. 
                      {startDate && endDate && !errors.dates && validityInfo.durationText && (
                        <span> 총 <strong>{validityInfo.durationText}</strong> 동안 검색 가능합니다.</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 파일 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                파일 첨부 *
              </label>
              <div 
                className={`border-2 border-dashed rounded-md p-6 ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                } ${errors.files ? 'border-red-500' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-1 text-sm text-gray-600">
                    파일을 여기에 드래그 앤 드롭하거나
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    파일 선택
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
              {errors.files && <p className="mt-1 text-sm text-red-500">{errors.files}</p>}
              
              {/* 선택된 파일 목록 */}
              {files.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">선택된 파일:</h4>
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {files.map((file, index) => (
                      <li key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-700 truncate max-w-xs">
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {/* 오른쪽 섹션: 요약 내용 */}
          <div className="lg:w-1/2">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                  요약 내용 * <span className="text-xs font-normal text-gray-500">(마크다운 지원)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showMarkdownPreview ? '편집모드' : '미리보기'}
                </button>
              </div>
              
              {showMarkdownPreview ? (
                <div 
                  className={`flex-grow border rounded-md p-4 overflow-y-auto h-[500px] markdown-preview ${errors.summary ? 'border-red-500' : 'border-gray-300'}`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
                  style={{
                    lineHeight: '1.6',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                  }}
                ></div>
              ) : (
                <textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={12}
                  className={`flex-grow w-full p-3 border rounded-md h-[500px] font-mono ${errors.summary ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="문서의 요약 내용을 입력하세요. 마크다운 형식으로 작성 가능합니다.

# 문서 제목
## 부제목
### 소제목

**굵게 표시할 내용**
*기울임꼴로 표시할 내용*

* 순서 없는 목록 항목 1
* 순서 없는 목록 항목 2

1. 순서 있는 목록 항목 1
2. 순서 있는 목록 항목 2

`인라인 코드 표시`

```
코드 블록 표시
여러 줄의 코드를 작성할 수 있습니다.
```

[링크 텍스트](https://example.com)"
                ></textarea>
              )}
              
              {errors.summary && <p className="mt-1 text-sm text-red-500">{errors.summary}</p>}
              
              <div className="mt-2 text-xs text-gray-500">
                <p><strong>마크다운 도움말:</strong></p>
                <ul className="list-disc ml-4 space-y-1">
                  <li># 제목, ## 부제목, ### 소제목</li>
                  <li>**굵게**, *기울임*</li>
                  <li>`코드` - 인라인 코드</li>
                  <li>```코드 블록```</li>
                  <li>* 항목 - 순서 없는 목록</li>
                  <li>1. 항목 - 순서 있는 목록</li>
                  <li>[링크텍스트](URL) - 링크 삽입</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* 작업 진행 상황 표시 (전체 작업) */}
        {taskId && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">문서 처리 진행 상황</h3>
            <TaskProgress 
              taskId={taskId}
              onComplete={handleTaskComplete}
              onError={handleTaskError}
              message={uploadComplete ? "문서 벡터화 및 처리 작업이 진행 중입니다..." : "파일 업로드 중입니다..."}
            />
          </div>
        )}
        
        {/* 파일별 업로드 상태 표시 */}
        {uploadedDocumentId && (
          <FileUploadStatus 
            documentId={uploadedDocumentId} 
            files={files}
            onComplete={handleFilesStatusComplete}
          />
        )}

        {/* 제출 버튼 */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={isUploading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
          >
            {isUploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UploadForm; 
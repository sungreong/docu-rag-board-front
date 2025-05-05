import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * 문서 편집 폼 컴포넌트
 * 
 * @param {Object} document - 편집할 문서 객체
 * @param {Object} fileStatuses - 파일 상태 정보
 * @param {boolean} loadingFileStatuses - 파일 상태 로딩 중 여부
 * @param {Function} onSave - 저장 시 호출할 함수
 * @param {Function} onCancel - 취소 시 호출할 함수
 * @param {Function} onFileDownload - 파일 다운로드 시 호출할 함수
 * @param {Function} onFileDelete - 파일 삭제 시 호출할 함수
 * @param {Function} onFileVisibilityToggle - 파일 공개/비공개 설정 시 호출할 함수
 */
function DocumentEditForm({
  document,
  fileStatuses,
  loadingFileStatuses,
  onSave,
  onCancel,
  onFileDownload,
  onFileDelete,
  onFileVisibilityToggle
}) {
  // 폼 상태 관리
  const [editForm, setEditForm] = useState({
    title: document.title || '',
    summary: document.summary || '',
    tags: document.tags || [],
    start_date: document.start_date || '',
    end_date: document.end_date || '',
    is_public: document.is_public // 공개 여부 상태
  });
  
  // 마크다운 미리보기 상태
  const [previewMode, setPreviewMode] = useState(false);
  
  // 추가 파일 관리
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const additionalFileInputRef = useRef(null);

  // 폼 필드 변경 처리
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 태그 입력 처리
  const handleTagsChange = (e) => {
    const tagsInput = e.target.value;
    // 쉼표로 구분된 태그를 배열로 변환
    const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    setEditForm(prev => ({
      ...prev,
      tags: tagsArray
    }));
  };

  // 파일 선택 처리
  const handleSelectAdditionalFiles = () => {
    additionalFileInputRef.current?.click();
  };

  // 파일 선택 변경 처리
  const handleAdditionalFileChange = (e) => {
    if (e.target.files) {
      setAdditionalFiles(Array.from(e.target.files));
    }
  };

  // 추가 파일 제거
  const handleRemoveAdditionalFile = (index) => {
    setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 저장 핸들러
  const handleSubmit = () => {
    onSave(editForm, additionalFiles);
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">문서 수정</h3>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        {/* 제목 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">제목</label>
          <input 
            type="text" 
            name="title" 
            value={editForm.title} 
            onChange={handleFormChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* 공개/비공개 설정 */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="is_public"
              checked={editForm.is_public}
              onChange={handleFormChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">공개 문서로 설정</span>
          </label>
          <div className="ml-4 text-xs text-gray-500">
            {editForm.is_public 
              ? '모든 사용자가 검색하고 볼 수 있습니다.' 
              : '작성자와 관리자만 볼 수 있습니다.'}
          </div>
        </div>
        
        {/* 요약 내용 (마크다운) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            요약 (마크다운 지원)
            <span className="ml-2 text-xs text-blue-600 font-normal">
              마크다운 형식으로 작성하면 더 풍부한 표현이 가능합니다.
            </span>
          </label>
          <div className="flex space-x-2 mb-2">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={`px-3 py-1 text-sm rounded ${!previewMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              편집
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={`px-3 py-1 text-sm rounded ${previewMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              미리보기
            </button>
          </div>
          
          {previewMode ? (
            <div className="p-3 border rounded-md bg-white h-64 overflow-y-auto markdown-content">
              <ReactMarkdown>{editForm.summary}</ReactMarkdown>
            </div>
          ) : (
            <textarea 
              name="summary" 
              value={editForm.summary} 
              onChange={handleFormChange}
              rows="10"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          )}
          
          <div className="mt-1 text-xs text-gray-500">
            <p>마크다운 문법 안내: <strong># 제목</strong>, <strong>**굵게**</strong>, <strong>*기울임*</strong>, <strong>`코드`</strong>, <strong>- 목록</strong> 등 사용 가능</p>
          </div>
        </div>
        
        {/* 태그 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">태그 (쉼표로 구분)</label>
          <input 
            type="text" 
            value={editForm.tags.join(', ')} 
            onChange={handleTagsChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* 유효기간 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">시작일</label>
            <input 
              type="date" 
              name="start_date" 
              value={editForm.start_date ? new Date(editForm.start_date).toISOString().split('T')[0] : ''}
              onChange={handleFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">종료일</label>
            <input 
              type="date" 
              name="end_date" 
              value={editForm.end_date ? new Date(editForm.end_date).toISOString().split('T')[0] : ''}
              onChange={handleFormChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* 기존 파일 관리 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">기존 파일 관리</label>
          {document.file_names && document.file_names.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {document.file_names.map((fileName, index) => (
                <div key={index} className="flex items-center justify-between border rounded p-3 bg-white">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{fileName}</span>
                  </div>
                  <div className="flex space-x-2">
                    {/* 공개/비공개 토글 버튼 */}
                    {loadingFileStatuses ? (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded animate-pulse">
                        로딩 중...
                      </span>
                    ) : (
                      <button
                        onClick={(e) => onFileVisibilityToggle(
                          e, 
                          document.id, 
                          fileName, 
                          fileStatuses[fileName]?.is_public !== false
                        )}
                        className={`text-xs px-2 py-1 rounded ${
                          fileStatuses[fileName]?.is_public !== false
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {fileStatuses[fileName]?.is_public !== false ? '공개' : '비공개'}
                      </button>
                    )}
                    
                    {/* 다운로드 버튼 */}
                    <button
                      onClick={(e) => onFileDownload(e, document.id, fileName)}
                      className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
                    >
                      다운로드
                    </button>
                    
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => onFileDelete(e, document.id, fileName)}
                      className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-gray-500 bg-gray-50 rounded border border-gray-200">
              첨부 파일이 없습니다.
            </div>
          )}
        </div>
        
        {/* 새 파일 업로드 섹션 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">새 파일 업로드</label>
          <div className="border-2 border-dashed rounded-md p-6 border-gray-300">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-1 text-sm text-gray-600">
                파일을 여기에 드래그하거나
              </p>
              <button
                type="button"
                onClick={handleSelectAdditionalFiles}
                className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                파일 선택
              </button>
              <input
                type="file"
                ref={additionalFileInputRef}
                multiple
                onChange={handleAdditionalFileChange}
                className="hidden"
              />
            </div>
          </div>
          
          {/* 선택된 추가 파일 표시 */}
          {additionalFiles.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">새로 추가할 파일:</h4>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {additionalFiles.map((file, index) => (
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
                      onClick={() => handleRemoveAdditionalFile(index)}
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
        
        {/* 버튼 영역 */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentEditForm; 
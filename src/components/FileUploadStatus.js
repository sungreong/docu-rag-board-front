import React, { useState, useEffect } from 'react';
import { taskService } from '../api';

function FileUploadStatus({ documentId, files, onComplete }) {
  const [filesStatus, setFilesStatus] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // 파일 상태 표시를 위한 스타일 및 아이콘 정의
  const getStatusStyle = (status) => {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  const getStatusMessage = (status) => {
    switch(status) {
      case 'completed':
        return '업로드 완료';
      case 'failed':
        return '업로드 실패';
      case 'processing':
        return '처리 중...';
      default:
        return '상태 확인 중...';
    }
  };
  
  // 문서 ID가 있으면 파일 상태 확인 시작
  useEffect(() => {
    if (documentId) {
      startPolling();
    }
    
    return () => {
      setIsPolling(false); // 컴포넌트 언마운트 시 폴링 중지
    };
  }, [documentId]);
  
  // 파일 상태 폴링 시작
  const startPolling = async () => {
    if (isPolling || !documentId) return;
    
    setIsPolling(true);
    setErrorMessage(null);
    
    try {
      // 초기 상태 설정 (파일 목록 기반)
      if (files && files.length > 0) {
        const initialStatus = files.map(file => ({
          original_filename: file.name,
          processing_status: 'processing',
          file_size: file.size
        }));
        setFilesStatus(initialStatus);
      }
      
      console.log('[FileUploadStatus] 파일 상태 폴링 시작:', documentId);
      
      // 상태 업데이트 콜백
      const onStatusUpdate = (statusData) => {
        console.log('[FileUploadStatus] 상태 업데이트 수신:', statusData);
        
        if (statusData && Array.isArray(statusData)) {
          setFilesStatus(statusData);
          
          // 모든 파일이 완료되었는지 확인
          const allCompleted = statusData.every(file => 
            file.processing_status === 'completed' || file.processing_status === 'failed');
            
          console.log('[FileUploadStatus] 모든 파일 처리 완료 여부:', allCompleted);
          
          if (allCompleted && onComplete) {
            console.log('[FileUploadStatus] onComplete 콜백 호출');
            onComplete(statusData);
          }
        } else if (statusData && statusData.error) {
          console.error('[FileUploadStatus] 상태 업데이트 오류:', statusData.error);
          setErrorMessage(statusData.error);
        }
      };
      
      // 폴링 시작
      await taskService.pollDocumentFilesStatus(documentId, onStatusUpdate);
      
    } catch (error) {
      console.error('[FileUploadStatus] 파일 상태 확인 오류:', error);
      setErrorMessage(error.message || '파일 상태 확인 중 오류가 발생했습니다.');
    } finally {
      setIsPolling(false);
    }
  };
  
  // 파일이 없거나 상태 정보가 없는 경우
  if (!filesStatus || filesStatus.length === 0) {
    return (
      <div className="mt-4 p-4 border rounded bg-gray-50">
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-600">파일 상태 확인 중...</span>
        </div>
      </div>
    );
  }
  
  // 오류 발생 시
  if (errorMessage) {
    return (
      <div className="mt-4 p-4 border border-red-300 rounded bg-red-50 text-red-800">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-gray-900 mb-2">파일 업로드 상태</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3 bg-gray-50">
        {filesStatus.map((file, index) => (
          <div 
            key={index} 
            className={`flex items-center justify-between p-3 border rounded ${getStatusStyle(file.processing_status)}`}
          >
            <div className="flex items-center space-x-2">
              {getStatusIcon(file.processing_status)}
              <span className="text-sm font-medium truncate max-w-md">{file.original_filename}</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs font-medium mr-2">
                {getStatusMessage(file.processing_status)}
              </span>
              {file.processing_status === 'failed' && file.error_message && (
                <span className="text-xs text-red-600 ml-2" title={file.error_message}>
                  오류: {file.error_message.slice(0, 30)}{file.error_message.length > 30 ? '...' : ''}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* 진행 상황 요약 */}
      <div className="mt-2 flex justify-between text-sm text-gray-600">
        <span>
          총 {filesStatus.length}개 파일 중 
          {filesStatus.filter(f => f.processing_status === 'completed').length}개 완료, 
          {filesStatus.filter(f => f.processing_status === 'failed').length}개 실패, 
          {filesStatus.filter(f => f.processing_status === 'processing').length}개 처리 중
        </span>
      </div>
    </div>
  );
}

export default FileUploadStatus; 
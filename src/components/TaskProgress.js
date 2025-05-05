import React, { useState, useEffect } from 'react';
import { taskService } from '../api';

// 작업 상태에 따른 스타일 설정
const getStatusStyle = (status) => {
  switch(status) {
    case 'SUCCESS':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'FAILURE':
    case 'ERROR':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'REVOKED':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'STARTED':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'PENDING':
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  }
};

// 작업 상태에 따른 한글 메시지
const getStatusMessage = (status) => {
  switch(status) {
    case 'SUCCESS':
      return '작업 완료';
    case 'FAILURE':
      return '작업 실패';
    case 'ERROR':
      return '오류 발생';
    case 'REVOKED':
      return '작업 취소됨';
    case 'STARTED':
      return '처리 중...';
    case 'PENDING':
      return '대기 중...';
    default:
      return '상태 정보 없음';
  }
};

/**
 * Celery 작업 진행 상황을 표시하는 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.taskId - Celery 작업 ID
 * @param {Function} props.onComplete - 작업 완료 시 호출될 콜백 함수 (선택사항)
 * @param {Function} props.onError - 작업 실패 시 호출될 콜백 함수 (선택사항)
 * @param {boolean} props.autoHideOnComplete - 작업 완료 시 자동으로 숨길지 여부 (기본값: false)
 * @param {number} props.pollInterval - 작업 상태 확인 간격 (ms, 기본값: 2000)
 * @param {string} props.message - 기본 메시지 (선택사항)
 */
const TaskProgress = ({
  taskId,
  onComplete,
  onError,
  autoHideOnComplete = false,
  pollInterval = 2000,
  message = '작업이 처리 중입니다...'
}) => {
  const [taskStatus, setTaskStatus] = useState({
    status: 'PENDING',
    result: null,
    error: null
  });
  const [hidden, setHidden] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 작업 상태 업데이트 핸들러
  const handleStatusUpdate = (statusData) => {
    setTaskStatus(statusData);

    // 작업 완료 또는 실패 시 콜백 호출
    if (statusData.status === 'SUCCESS' && onComplete) {
      onComplete(statusData.result);
      if (autoHideOnComplete) {
        setTimeout(() => setHidden(true), 3000); // 3초 후 자동으로 숨김
      }
    } else if (['FAILURE', 'ERROR'].includes(statusData.status) && onError) {
      onError(statusData.error);
    }
  };

  // 경과 시간 측정
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 작업 상태 폴링
  useEffect(() => {
    if (!taskId) return;

    const poll = async () => {
      try {
        await taskService.pollTaskStatus(
          taskId,
          handleStatusUpdate,
          pollInterval
        );
      } catch (error) {
        console.error('작업 상태 폴링 오류:', error);
      }
    };

    poll();
  }, [taskId, pollInterval]);

  // 컴포넌트가 숨겨진 경우 렌더링하지 않음
  if (hidden) return null;

  // 기본 상태 메시지 또는 에러 메시지
  const statusMessage = taskStatus.error
    ? `오류: ${taskStatus.error}`
    : message;

  // 경과 시간 표시 (분:초 형식)
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  const timeDisplay = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className={`mt-4 p-4 border rounded-lg ${getStatusStyle(taskStatus.status)}`}>
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <div className="font-semibold">
            {getStatusMessage(taskStatus.status)}
          </div>
          <div className="text-sm">
            경과 시간: {timeDisplay}
          </div>
        </div>
        
        <div className="mt-2 text-sm">
          {statusMessage}
        </div>
        
        {/* 진행 상태 표시 바 */}
        {['PENDING', 'STARTED'].includes(taskStatus.status) && (
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-blue-500 animate-pulse"></div>
          </div>
        )}
        
        {/* 작업 완료 시 결과 표시 (선택적) */}
        {taskStatus.status === 'SUCCESS' && taskStatus.result && (
          <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-sm">
            <pre className="whitespace-pre-wrap">
              {typeof taskStatus.result === 'object'
                ? JSON.stringify(taskStatus.result, null, 2)
                : taskStatus.result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskProgress; 
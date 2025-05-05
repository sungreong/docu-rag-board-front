import apiClient from './client';

// Celery 작업 관리 API 함수들
const taskService = {
  // 작업 상태 조회
  getTaskStatus: async (taskId) => {
    try {
      const response = await apiClient.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('작업 상태 조회 오류:', error);
      throw error;
    }
  },

  // 작업 진행 상황 주기적으로 확인 (폴링 방식)
  pollTaskStatus: async (taskId, onStatusUpdate, interval = 2000, maxAttempts = 30) => {
    let attempts = 0;
    
    const checkStatus = async () => {
      try {
        attempts++;
        const statusData = await taskService.getTaskStatus(taskId);
        
        // 콜백으로 상태 정보 전달
        onStatusUpdate(statusData);
        
        // 작업이 완료되었거나 실패한 경우 폴링 중단
        if (['SUCCESS', 'FAILURE', 'REVOKED'].includes(statusData.status) || attempts >= maxAttempts) {
          return statusData;
        }
        
        // 작업이 아직 진행 중인 경우 일정 시간 후 다시 확인
        await new Promise(resolve => setTimeout(resolve, interval));
        return checkStatus();
      } catch (error) {
        console.error('작업 상태 폴링 오류:', error);
        onStatusUpdate({ 
          task_id: taskId, 
          status: 'ERROR', 
          error: error.message || '알 수 없는 오류가 발생했습니다.' 
        });
        throw error;
      }
    };
    
    return checkStatus();
  },

  // 관리자 전용: 활성 작업 목록 조회
  getActiveTasks: async () => {
    try {
      const response = await apiClient.get('/tasks/active/list');
      return response.data;
    } catch (error) {
      console.error('활성 작업 목록 조회 오류:', error);
      throw error;
    }
  },

  // 관리자 전용: 작업 취소
  cancelTask: async (taskId, terminate = false) => {
    try {
      const response = await apiClient.delete(`/tasks/${taskId}?terminate=${terminate}`);
      return response.data;
    } catch (error) {
      console.error('작업 취소 오류:', error);
      throw error;
    }
  },

  // 문서의 모든 파일 상태 조회
  getDocumentFilesStatus: async (documentId) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}/files/status`);
      return response.data;
    } catch (error) {
      console.error('파일 상태 조회 오류:', error);
      throw error;
    }
  },
  
  // 문서의 파일 상태 주기적으로 확인 (폴링 방식)
  pollDocumentFilesStatus: async (documentId, onStatusUpdate, interval = 3000, maxAttempts = 20) => {
    let attempts = 0;
    console.log(`[taskService] 문서 ID ${documentId}의 파일 상태 폴링 시작`);
    
    const checkStatus = async () => {
      try {
        attempts++;
        console.log(`[taskService] 파일 상태 확인 시도 ${attempts}/${maxAttempts}`);
        
        const filesStatus = await taskService.getDocumentFilesStatus(documentId);
        console.log(`[taskService] 파일 상태 응답 수신:`, filesStatus);
        
        // 콜백으로 상태 정보 전달
        onStatusUpdate(filesStatus);
        
        // 모든 파일이 완료(completed)되었거나 실패(failed)한 경우 또는 최대 시도 횟수 초과시 폴링 중단
        const allCompleted = filesStatus.every(file => 
          file.processing_status === 'completed' || file.processing_status === 'failed');
          
        console.log(`[taskService] 모든 파일 처리 완료: ${allCompleted}, 현재 시도: ${attempts}/${maxAttempts}`);
        
        if (allCompleted || attempts >= maxAttempts) {
          console.log(`[taskService] 파일 상태 폴링 종료 - ${allCompleted ? '모든 파일 처리 완료' : '최대 시도 횟수 도달'}`);
          return filesStatus;
        }
        
        // 지정된 시간 후 다시 상태 확인
        console.log(`[taskService] ${interval}ms 후 다시 확인`);
        await new Promise(resolve => setTimeout(resolve, interval));
        return checkStatus();
      } catch (error) {
        console.error('[taskService] 파일 상태 폴링 오류:', error);
        
        // 오류가 발생해도 최대 3번까지는 재시도
        if (attempts < 3) {
          console.log(`[taskService] 오류 발생 후 재시도 ${attempts}/3`);
          await new Promise(resolve => setTimeout(resolve, interval));
          return checkStatus();
        }
        
        const errorMessage = error.response?.data?.detail || error.message || '알 수 없는 오류';
        console.error(`[taskService] 파일 상태 폴링 최종 오류: ${errorMessage}`);
        onStatusUpdate([{ error: errorMessage }]);
        return [{ error: errorMessage }];
      }
    };
    
    return checkStatus();
  }
};

export { taskService }; 
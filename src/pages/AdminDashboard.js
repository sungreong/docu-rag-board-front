import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/adminService';
import DocumentListNew from '../components/DocumentListNew';
import UserManagement from '../components/UserManagement';

function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 기본값을 'pending'으로 변경
  const [pendingCount, setPendingCount] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(new Date()); // 마지막 새로고침 시간
  const [forceUpdate, setForceUpdate] = useState(0); // 강제 업데이트용 카운터 (필요시에만 사용)

  // 승인 대기 문서 수 가져오기 - 의존성 없음
  const fetchPendingCount = useCallback(async () => {
    if (isLoading) return; // 이미 로딩 중이면 중복 요청 방지
    
    setIsLoading(true);
    
    try {
      console.log('승인 대기 문서 수 가져오기 시작');
      const response = await adminApi.getStats();
      console.log('관리자 통계 응답:', response);
      
      if (response && response.data) {
        console.log('승인 대기 문서 수:', response.data.pending_approval);
        setPendingCount(response.data.pending_approval || 0);
      } else {
        console.warn('adminApi.getStats() 응답에 data 속성이 없습니다:', response);
        
        // 대체 방법으로 승인 대기 문서 수 계산
        try {
          console.log('대체 방법으로 승인 대기 문서 수 계산 시작');
          const docResponse = await adminApi.getAllDocuments();
          if (docResponse && docResponse.data) {
            const pendingDocs = docResponse.data.filter(doc => doc.status === '승인대기');
            console.log('문서 목록에서 계산한 승인 대기 문서 수:', pendingDocs.length);
            setPendingCount(pendingDocs.length);
          }
        } catch (docErr) {
          console.error('대체 방법으로 승인 대기 문서 수 계산 실패:', docErr);
        }
      }
      
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('승인 대기 문서 수 조회 오류:', err);
      setError('승인 대기 문서 수 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []); // isLoading 의존성 제거

  // 컴포넌트 최초 마운트 시에만 데이터 로드
  useEffect(() => {
    console.log('AdminDashboard: 최초 마운트 시 데이터 로드');
    fetchPendingCount();
    // 자동 새로고침 없음
  }, []); // 빈 의존성 배열 - 컴포넌트 마운트 시 1회만 실행

  // 탭 변경 시에만 데이터 로드
  useEffect(() => {
    console.log('AdminDashboard: 탭 변경 감지 - 데이터 로드');
    fetchPendingCount();
  }, [activeTab, fetchPendingCount]); // 탭 변경 시에만 실행

  // 알림 표시 함수
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // 문서 목록 변경 후 실행할 콜백 - 최대한 간단하게 유지
  const handleListRefresh = useCallback(() => {
    console.log('문서 목록 새로고침 감지');
    // 실시간 업데이트 없이 사용자가 수동으로 새로고침할 때만 fetchPendingCount 호출
  }, []);

  // 수동 새로고침 처리
  const handleManualRefresh = () => {
    if (isLoading) return;
    
    setIsLoading(true);
    fetchPendingCount()
      .finally(() => {
        setIsLoading(false);
        setForceUpdate(prev => prev + 1); // 문서 목록도 강제 새로고침
        showNotification('데이터가 새로고침되었습니다.');
      });
  };

  // 문서 승인 처리 - 성공 시 지연 후 카운트 갱신
  const handleApproveDocument = async (docId) => {
    try {
      await adminApi.approveDocument(docId);
      showNotification('문서가 성공적으로 승인되었습니다.');
      
      // 승인 후 지연시간을 두고 데이터 업데이트
      setTimeout(() => {
        fetchPendingCount();
        // 문서 목록은 DocumentListNew 컴포넌트에서 자체적으로 갱신
      }, 500);
    } catch (error) {
      console.error('문서 승인 오류:', error);
      setError('문서 승인 중 오류가 발생했습니다.');
    }
  };

  // 문서 거부 처리 - 성공 시 지연 후 카운트 갱신
  const handleRejectDocument = async (docId) => {
    try {
      const reason = prompt('거부 이유를 입력해주세요 (선택사항):', '');
      if (reason === null) return; // 사용자가 취소한 경우
      
      await adminApi.rejectDocument(docId, reason);
      showNotification('문서가 거부되었습니다.');
      
      // 거부 후 지연시간을 두고 데이터 업데이트
      setTimeout(() => {
        fetchPendingCount();
        // 문서 목록은 DocumentListNew 컴포넌트에서 자체적으로 갱신
      }, 500);
    } catch (error) {
      console.error('문서 거부 오류:', error);
      setError('문서 거부 중 오류가 발생했습니다.');
    }
  };

  // 문서 벡터화 처리
  const handleVectorizeDocument = async (docId) => {
    try {
      await adminApi.vectorizeDocument(docId);
      showNotification('문서 벡터화가 요청되었습니다.');
    } catch (error) {
      console.error('문서 벡터화 오류:', error);
      setError('문서 벡터화 중 오류가 발생했습니다.');
    }
  };

  // 문서 벡터 삭제 처리
  const handleDeleteDocumentVector = async (docId) => {
    try {
      await adminApi.deleteDocumentVector(docId);
      showNotification('문서 벡터가 삭제되었습니다.');
    } catch (error) {
      console.error('문서 벡터 삭제 오류:', error);
      setError('문서 벡터 삭제 중 오류가 발생했습니다.');
    }
  };

  // PageTitle 컴포넌트
  const PageTitle = ({ title, count, isLoading }) => (
    <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
      {title}
      {count !== undefined && (
        <span className="ml-2 px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
          {isLoading ? '로딩 중' : count}
        </span>
      )}
      {isLoading && (
        <svg className="animate-spin ml-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
    </h2>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 네비게이션 바 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">문서관리 시스템</h1>
              </div>
              <div className="ml-6 flex space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  일반 모드로 전환
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                관리자 모드
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
          
          {/* 새로고침 버튼 */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleManualRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  새로고침 중...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  새로고침
                </>
              )}
            </button>
            
            {/* 마지막 새로고침 시간 표시 */}
            <span className="text-xs text-gray-500">
              마지막 새로고침: {lastRefreshed.toLocaleString()}
            </span>
          </div>
        </div>
        
        {/* 알림 메시지 */}
        {notification && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{notification}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">승인 대기</h2>
                <p className="text-2xl font-bold text-yellow-500 mt-1">{pendingCount}</p>
                <p className="text-xs text-gray-500">활성 탭: {activeTab}</p>
              </div>
              <svg className="h-10 w-10 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex -mb-px">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              승인 대기 문서
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`ml-8 px-4 py-2 text-sm font-medium ${
                activeTab === 'documents'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              전체 문서 관리
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`ml-8 px-4 py-2 text-sm font-medium ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              사용자 관리
            </button>
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        {activeTab === 'pending' ? (
          <div className="bg-white rounded-lg shadow-md p-4">
            <PageTitle title="승인 대기 문서" count={pendingCount} isLoading={isLoading} />
            <DocumentListNew 
              key="pending-documents"
              isAdmin={true}
              onApprove={handleApproveDocument}
              onReject={handleRejectDocument}
              onVectorize={handleVectorizeDocument}
              onDeleteVector={handleDeleteDocumentVector}
              initialViewType="all"
              initialStatusFilter="승인대기"
              onListRefresh={handleListRefresh}
              forceUpdate={forceUpdate}
            />
          </div>
        ) : activeTab === 'documents' ? (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">모든 문서 목록</h2>
            <DocumentListNew 
              key="all-documents"
              isAdmin={true}
              onApprove={handleApproveDocument}
              onReject={handleRejectDocument}
              onVectorize={handleVectorizeDocument}
              onDeleteVector={handleDeleteDocumentVector}
              initialViewType="all"
              initialStatusFilter=""
              onListRefresh={handleListRefresh}
              forceUpdate={forceUpdate}
            />
          </div>
        ) : (
          <UserManagement />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard; 
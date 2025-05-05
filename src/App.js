import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css';
import UploadForm from './components/UploadForm';
import DocumentList from './components/DocumentList';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import Unauthorized from './components/Unauthorized';
import { AuthProvider, useAuth } from './utils/AuthContext';
import PrivateRoute from './utils/PrivateRoute';
import PublicRoute from './utils/PublicRoute';
import { documentsApi } from './api/documentService';
import { adminApi } from './api/adminService';

function AppContent() {
  const { user, logout, isAdmin } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('documents'); // 'documents', 'search'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 문서 목록 가져오기
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 백엔드 API 호출
      const response = await documentsApi.getMyDocuments();
      setDocuments(response.data);
    } catch (err) {
      console.error('문서 로드 오류:', err);
      setError('문서를 불러오는 중 오류가 발생했습니다.');
      
      // 백엔드 연결 안될 경우 모의 데이터 사용
      const mockDocuments = [
        { 
          id: 1, 
          title: '2023년 4분기 사업 계획서', 
          summary: '4분기 사업 목표 및 예산 계획에 관한 문서입니다. 각 부서별 목표와 KPI가 포함되어 있습니다.',
          tags: ['계획서', '사업', '4분기'], 
          fileNames: ['4Q_business_plan.pdf', 'budget_2023Q4.xlsx'],
          status: '승인완료',
          startDate: '2023-10-01',
          endDate: '2023-12-31',
          createdAt: new Date(2023, 8, 15).toISOString()
        },
        { 
          id: 2, 
          title: '인사규정 개정안', 
          summary: '2024년부터 적용될 인사규정 개정안에 관한 문서입니다. 주요 변경사항으로는 재택근무 규정 추가, 복리후생 항목 확대가 있습니다.',
          tags: ['인사', '규정', '개정'], 
          fileNames: ['HR_policy_2024.pdf', 'HR_changes_summary.docx'],
          status: '승인대기',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          createdAt: new Date(2023, 10, 20).toISOString()
        },
      ];
      
      setDocuments(mockDocuments);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // 업로드 성공 시 처리
  const handleUploadSuccess = (newDocument) => {
    setDocuments(prev => [newDocument, ...prev]);
    setShowUploadModal(false);
    // 업로드 후 문서 탭으로 이동
    setActiveTab('documents');
  };

  // 검색 처리
  const handleSearch = async (query) => {
    setSearchQuery(query);
    setIsSearching(true);
    try {
      const results = await documentsApi.searchDocuments(query);
      setSearchResults(results);
      // 검색 후 검색 결과 탭으로 이동
      setActiveTab('search');
    } catch (error) {
      console.error('검색 오류:', error);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    logout();
  };

  // 문서 승인 처리
  const handleApproveDocument = async (docId, onSuccess) => {
    try {
      if (isAdmin) {
        const response = await adminApi.approveDocument(docId);
        // 성공 콜백 실행
        if (typeof onSuccess === 'function') {
          onSuccess(response.data);
        }
      } else {
        // 일반 사용자용 승인 API 호출
        const response = await documentsApi.approveDocument(docId);
        // 성공 콜백 실행
        if (typeof onSuccess === 'function') {
          onSuccess(response.data);
        }
      }
      alert('문서가 성공적으로 승인되었습니다.');
      fetchDocuments(); // 목록 갱신
    } catch (error) {
      console.error('문서 승인 오류:', error);
      alert('문서 승인 중 오류가 발생했습니다.');
    }
  };

  // 문서 거부 처리
  const handleRejectDocument = async (docId, reason, onSuccess) => {
    try {
      // reason이 전달되지 않았으면 사용자에게 물어봄
      const rejectReason = reason || prompt('거부 이유를 입력해주세요 (선택사항):', '');
      
      // 사용자가 취소한 경우
      if (rejectReason === null && !reason) {
        return;
      }
      
      if (isAdmin) {
        const response = await adminApi.rejectDocument(docId, rejectReason);
        // 성공 콜백 실행
        if (typeof onSuccess === 'function') {
          onSuccess(response.data);
        }
      } else {
        // 일반 사용자용 거부 API 호출
        const response = await documentsApi.rejectDocument(docId, rejectReason);
        // 성공 콜백 실행
        if (typeof onSuccess === 'function') {
          onSuccess(response.data);
        }
      }
      alert('문서가 거부되었습니다.');
      fetchDocuments(); // 목록 갱신
    } catch (error) {
      console.error('문서 거부 오류:', error);
      alert('문서 거부 중 오류가 발생했습니다.');
    }
  };

  // 벡터화 처리 (관리자 전용)
  const handleVectorizeDocument = async (docId) => {
    try {
      await adminApi.vectorizeDocument(docId);
      alert('문서 벡터화가 요청되었습니다.');
      fetchDocuments(); // 목록 갱신
    } catch (error) {
      console.error('문서 벡터화 오류:', error);
      alert('문서 벡터화 중 오류가 발생했습니다.');
    }
  };

  // 벡터 삭제 처리 (관리자 전용)
  const handleDeleteDocumentVector = async (docId) => {
    try {
      await adminApi.deleteDocumentVector(docId);
      alert('문서 벡터가 삭제되었습니다.');
      fetchDocuments(); // 목록 갱신
    } catch (error) {
      console.error('문서 벡터 삭제 오류:', error);
      alert('문서 벡터 삭제 중 오류가 발생했습니다.');
    }
  };

  // 문서 업데이트 처리
  const handleUpdateDocument = async (docId, updateData) => {
    try {
      // 문서 업데이트 API 호출
      await documentsApi.updateDocument(docId, {
        ...updateData,
        status: '승인대기' // 수정 시 항상 승인 대기 상태로 변경
      });
      
      // 목록 갱신
      fetchDocuments();
    } catch (error) {
      console.error('문서 업데이트 오류:', error);
      alert('문서 업데이트 중 오류가 발생했습니다.');
      throw error; // 상위 컴포넌트에서 추가 처리할 수 있도록 오류 전파
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 및 네비게이션 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-blue-600">문서관리 시스템</Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  홈
                </Link>
                
                {isAdmin() && (
                  <Link
                    to="/admin"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    관리자
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">{user?.email || '사용자'}</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-6">
        <div className="max-w-14xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 컨텐츠 */}
          <div className="mb-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h2 className="text-lg leading-6 font-medium text-gray-900">
                    {activeTab === 'documents' ? '내 문서 목록' : '문서 검색'}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {activeTab === 'documents' 
                      ? '업로드한 문서 목록을 확인하고 관리합니다' 
                      : '키워드 기반으로 문서를 검색합니다'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                      activeTab === 'documents'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    문서 목록
                  </button>
                  <button
                    onClick={() => setActiveTab('search')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                      activeTab === 'search'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    문서 검색
                  </button>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="ml-3 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    문서 등록
                  </button>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 my-2 rounded">
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

              {/* 컨텐츠 영역 */}
              <div className="p-4">
                {activeTab === 'documents' ? (
                  <DocumentList 
                    documents={documents} 
                    onRefresh={fetchDocuments} 
                    isLoading={isLoading}
                    isAdmin={isAdmin}
                    onApprove={handleApproveDocument}
                    onReject={handleRejectDocument}
                    onVectorize={handleVectorizeDocument}
                    onDeleteVector={handleDeleteDocumentVector}
                    onUpdateDocument={handleUpdateDocument}
                  />
                ) : (
                  <div className="space-y-6">
                    <SearchBar onSearch={handleSearch} isSearching={isSearching} />
                    
                    {searchResults.length > 0 && (
                      <SearchResults results={searchResults} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* 배경 오버레이 */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setShowUploadModal(false)}
            ></div>

            {/* 모달 창 */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  새 문서 등록
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setShowUploadModal(false)}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <UploadForm onUploadSuccess={handleUploadSuccess} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 공개 경로 */}
          <Route path="/login" element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          } />
          
          {/* 인증 필요 경로 */}
          <Route path="/" element={
            <PrivateRoute>
              <AppContent />
            </PrivateRoute>
          } />
          
          {/* 관리자 전용 경로 */}
          <Route path="/admin" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          
          {/* 권한 없음 페이지 */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* 기타 경로는 홈으로 리디렉션 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

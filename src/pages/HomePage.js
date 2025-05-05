import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DocumentListNew from '../components/DocumentListNew';
import { useAuth } from '../utils/AuthContext';
import { documentsApi } from '../api/documentService';
import { adminApi } from '../api/adminService';

function HomePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // 문서 승인 처리 함수
  const handleApproveDocument = async (documentId) => {
    try {
      await documentsApi.approveDocument(documentId);
      alert('문서가 승인되었습니다.');
    } catch (error) {
      console.error('문서 승인 오류:', error);
      alert('문서 승인 중 오류가 발생했습니다.');
    }
  };

  // 문서 거부 처리 함수
  const handleRejectDocument = async (documentId, reason = '') => {
    try {
      await documentsApi.rejectDocument(documentId, reason);
      alert('문서가 거부되었습니다.');
    } catch (error) {
      console.error('문서 거부 오류:', error);
      alert('문서 거부 중 오류가 발생했습니다.');
    }
  };

  // 문서 벡터화 처리 함수 (관리자 전용)
  const handleVectorizeDocument = async (documentId, options = {}) => {
    if (user?.role !== 'admin') return;
    
    try {
      await adminApi.vectorizeDocument(documentId, options);
      alert('문서 벡터화 작업이 요청되었습니다.');
    } catch (error) {
      console.error('문서 벡터화 오류:', error);
      alert('문서 벡터화 중 오류가 발생했습니다.');
    }
  };

  // 문서 벡터 삭제 처리 함수 (관리자 전용)
  const handleDeleteVector = async (documentId) => {
    if (user?.role !== 'admin') return;
    
    try {
      await adminApi.deleteDocumentVector(documentId);
      alert('문서 벡터가 삭제되었습니다.');
    } catch (error) {
      console.error('벡터 삭제 오류:', error);
      alert('벡터 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                  to="/upload"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-blue-500"
                >
                  문서 업로드
                </Link>
                <Link
                  to="/search"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-blue-500"
                >
                  문서 검색
                </Link>
                {user && user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-blue-500"
                  >
                    관리자 대시보드
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">{user.email}</span>
                    {user.role === 'admin' && <span className="ml-1 text-xs text-blue-600">(관리자)</span>}
                  </span>
                  <button
                    onClick={logout}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">문서 게시판</h1>
          <p className="text-gray-600 mb-4">
            승인된 공개 문서를 확인하거나, 내가 올린 문서를 관리하세요.
          </p>
          
          {/* 검색창 */}
          <div className="mb-6">
            <div className="flex rounded-md shadow-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목, 태그, 내용으로 검색"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <Link
                to={`/search?query=${encodeURIComponent(searchQuery)}`}
                className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                검색
              </Link>
            </div>
          </div>

          {/* 문서 업로드 버튼 */}
          <div className="flex justify-between mb-6">
            <div></div>
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              문서 업로드
            </Link>
          </div>
        </div>

        {/* 문서 목록 */}
        <DocumentListNew 
          isAdmin={user?.role === 'admin'}
          onApprove={handleApproveDocument}
          onReject={handleRejectDocument}
          onVectorize={handleVectorizeDocument}
          onDeleteVector={handleDeleteVector}
          initialViewType="public"  // 기본적으로 공개 문서만 보이도록 설정
          initialStatusFilter="승인완료"  // 기본적으로 승인된 문서만 보이도록 설정
        />
      </div>
    </div>
  );
}

export default HomePage; 
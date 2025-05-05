import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DocumentListNew from '../components/DocumentListNew';
import { useAuth } from '../utils/AuthContext';
import { documentsApi } from '../api/documentService';
import { adminApi } from '../api/adminService';
import Layout from '../components/Layout';
import UserManagement from '../components/UserManagement';

function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' 또는 'users'

  // 비관리자가 접근하면 홈으로 리다이렉트
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      alert('관리자만 접근할 수 있는 페이지입니다.');
      navigate('/');
    }
  }, [user, navigate]);

  // 문서 승인 처리 함수
  const handleApproveDocument = async (documentId) => {
    try {
      await documentsApi.approveDocument(documentId);
      alert('문서가 승인되었습니다.');
      setForceUpdate(prev => prev + 1);
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
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('문서 거부 오류:', error);
      alert('문서 거부 중 오류가 발생했습니다.');
    }
  };

  // 문서 벡터화 처리 함수 (관리자 전용)
  const handleVectorizeDocument = async (documentId, options = {}) => {
    try {
      await adminApi.vectorizeDocument(documentId, options);
      alert('문서 벡터화 작업이 요청되었습니다.');
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('문서 벡터화 오류:', error);
      alert('문서 벡터화 중 오류가 발생했습니다.');
    }
  };

  // 문서 벡터 삭제 처리 함수 (관리자 전용)
  const handleDeleteVector = async (documentId) => {
    try {
      await adminApi.deleteDocumentVector(documentId);
      alert('문서 벡터가 삭제되었습니다.');
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('벡터 삭제 오류:', error);
      alert('벡터 삭제 중 오류가 발생했습니다.');
    }
  };

  // 선택한 문서 처리를 위한 함수들
  const handleDocumentSelect = (docId, isSelected) => {
    if (isSelected) {
      setSelectedDocuments(prev => [...prev, docId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== docId));
    }
  };

  // 선택한 문서 일괄 승인
  const handleApproveSelected = async () => {
    if (!selectedDocuments.length) return;
    
    if (window.confirm(`선택한 ${selectedDocuments.length}개의 문서를 승인하시겠습니까?`)) {
      try {
        // 순차적으로 승인 처리
        for (const docId of selectedDocuments) {
          await documentsApi.approveDocument(docId);
        }
        
        alert(`${selectedDocuments.length}개의 문서가 승인되었습니다.`);
        setSelectedDocuments([]);
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('문서 일괄 승인 오류:', error);
        alert('일부 문서 승인 중 오류가 발생했습니다.');
      }
    }
  };

  // 선택한 문서 일괄 거부
  const handleRejectSelected = async () => {
    if (!selectedDocuments.length) return;
    
    const reason = prompt('거부 사유를 입력하세요 (선택사항):', '');
    
    if (window.confirm(`선택한 ${selectedDocuments.length}개의 문서를 거부하시겠습니까?`)) {
      try {
        // 순차적으로 거부 처리
        for (const docId of selectedDocuments) {
          await documentsApi.rejectDocument(docId, reason || '');
        }
        
        alert(`${selectedDocuments.length}개의 문서가 거부되었습니다.`);
        setSelectedDocuments([]);
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('문서 일괄 거부 오류:', error);
        alert('일부 문서 거부 중 오류가 발생했습니다.');
      }
    }
  };

  // 선택한 문서 일괄 삭제
  const handleDeleteSelected = async () => {
    if (!selectedDocuments.length) return;
    
    if (window.confirm(`선택한 ${selectedDocuments.length}개의 문서를 완전히 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`)) {
      try {
        // 순차적으로 삭제 처리
        for (const docId of selectedDocuments) {
          await adminApi.deleteDocument(docId);
        }
        
        alert(`${selectedDocuments.length}개의 문서가 완전히 삭제되었습니다.`);
        setSelectedDocuments([]);
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('문서 일괄 삭제 오류:', error);
        alert('일부 문서 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 선택한 문서 벡터화 요청
  const handleVectorizeSelected = async () => {
    if (!selectedDocuments.length) return;
    
    if (window.confirm(`선택한 ${selectedDocuments.length}개의 문서를 벡터화하시겠습니까?`)) {
      try {
        // 순차적으로 벡터화 처리
        for (const docId of selectedDocuments) {
          await adminApi.vectorizeDocument(docId);
        }
        
        alert(`${selectedDocuments.length}개의 문서에 대한 벡터화가 요청되었습니다.`);
        setSelectedDocuments([]);
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('문서 일괄 벡터화 요청 오류:', error);
        alert('일부 문서 벡터화 요청 중 오류가 발생했습니다.');
      }
    }
  };

  // 선택한 문서 벡터 삭제 요청
  const handleDeleteVectorSelected = async () => {
    if (!selectedDocuments.length) return;
    
    if (window.confirm(`선택한 ${selectedDocuments.length}개의 문서의 벡터를 삭제하시겠습니까?`)) {
      try {
        // 순차적으로 벡터 삭제 처리
        for (const docId of selectedDocuments) {
          await adminApi.deleteDocumentVector(docId);
        }
        
        alert(`${selectedDocuments.length}개의 문서의 벡터가 삭제되었습니다.`);
        setSelectedDocuments([]);
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('문서 일괄 벡터 삭제 오류:', error);
        alert('일부 문서 벡터 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  if (!user || user.role !== 'admin') {
    return null; // 비관리자는 렌더링하지 않음
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">관리자 대시보드</h1>
          
          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('documents')}
                className={`${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                문서 관리
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                사용자 관리
              </button>
            </nav>
          </div>
          
          {activeTab === 'documents' && (
            <>
              <p className="text-gray-600 mb-4">
                모든 문서를 관리하고, 승인/거부 처리를 할 수 있습니다. 벡터화 요청도 처리할 수 있습니다.
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

              {/* 작업 버튼 영역 */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedDocuments.length > 0 && (
                  <>
                    <button
                      onClick={handleApproveSelected}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      선택 승인 ({selectedDocuments.length})
                    </button>
                    
                    <button
                      onClick={handleRejectSelected}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                    >
                      선택 거부 ({selectedDocuments.length})
                    </button>
                    
                    <button
                      onClick={handleVectorizeSelected}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                      선택 벡터화 ({selectedDocuments.length})
                    </button>
                    
                    <button
                      onClick={handleDeleteVectorSelected}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                    >
                      선택 벡터 삭제 ({selectedDocuments.length})
                    </button>
                    
                    <button
                      onClick={handleDeleteSelected}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      선택 완전 삭제 ({selectedDocuments.length})
                    </button>
                  </>
                )}
              </div>

              {/* 문서 목록 - 전체 문서 조회 (관리자 전용) */}
              <DocumentListNew 
                isAdmin={true}
                onApprove={handleApproveDocument}
                onReject={handleRejectDocument}
                onVectorize={handleVectorizeDocument}
                onDeleteVector={handleDeleteVector}
                initialViewType="all" // 모든 문서 표시
                initialStatusFilter="" // 모든 상태의 문서 표시
                forceUpdate={forceUpdate}
                onSelectDocument={handleDocumentSelect}
                selectedDocuments={selectedDocuments}
              />
            </>
          )}
          
          {activeTab === 'users' && (
            <>
              <p className="text-gray-600 mb-4">
                사용자 계정을 관리하고, 승인/비활성화/활성화 처리를 할 수 있습니다.
              </p>
              <UserManagement />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AdminPage; 
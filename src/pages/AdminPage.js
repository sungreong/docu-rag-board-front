import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import DocumentList from '../components/DocumentList';
import { documentsApi } from '../api';
import { adminApi } from '../api/adminService';

function AdminPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_documents: 0,
    pending_approval: 0,
    approved: 0,
    vectorized: 0
  });

  // 문서 목록 로드
  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllDocuments();
      setDocuments(response.data);
    } catch (error) {
      console.error('문서 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 통계 데이터 로드
  const loadStats = async () => {
    try {
      const response = await adminApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('통계 데이터 로드 오류:', error);
    }
  };

  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    loadDocuments();
    loadStats();
  }, []);

  // 문서 승인 처리
  const handleApproveDocument = async (documentId) => {
    try {
      await adminApi.approveDocument(documentId);
      loadDocuments();
      loadStats();
    } catch (error) {
      console.error('문서 승인 오류:', error);
      alert('문서 승인 중 오류가 발생했습니다.');
    }
  };

  // 문서 거부 처리
  const handleRejectDocument = async (documentId, reason) => {
    try {
      await adminApi.rejectDocument(documentId, reason);
      loadDocuments();
      loadStats();
    } catch (error) {
      console.error('문서 거부 오류:', error);
      alert('문서 거부 중 오류가 발생했습니다.');
    }
  };

  // 문서 벡터화 처리
  const handleVectorizeDocument = async (documentId, options = {}) => {
    try {
      await adminApi.vectorizeDocument(documentId, options);
      loadDocuments();
    } catch (error) {
      console.error('문서 벡터화 오류:', error);
      alert('문서 벡터화 중 오류가 발생했습니다.');
    }
  };

  // 문서 벡터 삭제 처리
  const handleDeleteDocumentVector = async (documentId) => {
    try {
      await adminApi.deleteDocumentVector(documentId);
      loadDocuments();
    } catch (error) {
      console.error('문서 벡터 삭제 오류:', error);
      alert('문서 벡터 삭제 중 오류가 발생했습니다.');
    }
  };

  // 문서 업데이트 처리
  const handleUpdateDocument = async (documentId, documentData) => {
    try {
      await documentsApi.updateDocument(documentId, documentData);
      loadDocuments();
    } catch (error) {
      console.error('문서 업데이트 오류:', error);
      alert('문서 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 유효기간 지난 문서 자동 체크
  const handleCheckValidity = async () => {
    try {
      setLoading(true);
      const response = await adminApi.checkDocumentsValidity();
      
      const processedCount = response.data.processed_count || 0;
      
      if (processedCount > 0) {
        alert(`유효기간이 지난 ${processedCount}개 문서의 벡터가 삭제되었습니다.`);
        loadDocuments(); // 문서 목록 새로고침
        loadStats(); // 통계 새로고침
      } else {
        alert('유효기간이 지난 문서가 없습니다.');
      }
    } catch (error) {
      console.error('유효기간 체크 오류:', error);
      alert('유효기간 체크 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 문서 목록 
  const getFilteredDocuments = (status) => {
    if (status === 'all') return documents;
    return documents.filter(doc => doc.status === status);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">관리자 페이지</h1>
      
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700">전체 문서</h2>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total_documents}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700">승인 대기</h2>
          <p className="text-3xl font-bold text-yellow-500 mt-2">{stats.pending_approval}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700">승인 완료</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700">벡터화 문서</h2>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.vectorized}</p>
        </div>
      </div>
      
      {/* 관리자 액션 버튼들 */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => loadDocuments()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          <i className="fas fa-sync-alt mr-2"></i>
          새로고침
        </button>
        
        <button
          onClick={handleCheckValidity}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          disabled={loading}
        >
          <i className="fas fa-calendar-check mr-2"></i>
          유효기간 검증 및 벡터 정리
        </button>
      </div>
      
      {/* 탭 메뉴 */}
      <Tab.Group onChange={setActiveTab} selectedIndex={activeTab}>
        <Tab.List className="flex p-1 space-x-1 bg-blue-100 rounded-lg mb-6">
          <Tab
            className={({ selected }) =>
              `py-2 px-4 text-sm font-medium rounded-lg focus:outline-none ${
                selected
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-900 hover:bg-blue-200'
              }`
            }
          >
            전체 문서 ({documents.length})
          </Tab>
          <Tab
            className={({ selected }) =>
              `py-2 px-4 text-sm font-medium rounded-lg focus:outline-none ${
                selected
                  ? 'bg-yellow-500 text-white'
                  : 'text-yellow-700 hover:bg-yellow-200'
              }`
            }
          >
            승인 대기 ({getFilteredDocuments('승인대기').length})
          </Tab>
          <Tab
            className={({ selected }) =>
              `py-2 px-4 text-sm font-medium rounded-lg focus:outline-none ${
                selected
                  ? 'bg-green-600 text-white'
                  : 'text-green-700 hover:bg-green-200'
              }`
            }
          >
            승인 완료 ({getFilteredDocuments('승인완료').length})
          </Tab>
          <Tab
            className={({ selected }) =>
              `py-2 px-4 text-sm font-medium rounded-lg focus:outline-none ${
                selected
                  ? 'bg-indigo-600 text-white'
                  : 'text-indigo-700 hover:bg-indigo-200'
              }`
            }
          >
            벡터화됨 ({documents.filter(doc => doc.vectorized).length})
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <DocumentList
              documents={documents}
              onRefresh={loadDocuments}
              isLoading={loading}
              isAdmin={true}
              onApprove={handleApproveDocument}
              onReject={handleRejectDocument}
              onVectorize={handleVectorizeDocument}
              onDeleteVector={handleDeleteDocumentVector}
              onUpdateDocument={handleUpdateDocument}
            />
          </Tab.Panel>
          <Tab.Panel>
            <DocumentList
              documents={getFilteredDocuments('승인대기')}
              onRefresh={loadDocuments}
              isLoading={loading}
              isAdmin={true}
              onApprove={handleApproveDocument}
              onReject={handleRejectDocument}
              onVectorize={handleVectorizeDocument}
              onDeleteVector={handleDeleteDocumentVector}
              onUpdateDocument={handleUpdateDocument}
            />
          </Tab.Panel>
          <Tab.Panel>
            <DocumentList
              documents={getFilteredDocuments('승인완료')}
              onRefresh={loadDocuments}
              isLoading={loading}
              isAdmin={true}
              onApprove={handleApproveDocument}
              onReject={handleRejectDocument}
              onVectorize={handleVectorizeDocument}
              onDeleteVector={handleDeleteDocumentVector}
              onUpdateDocument={handleUpdateDocument}
            />
          </Tab.Panel>
          <Tab.Panel>
            <DocumentList
              documents={documents.filter(doc => doc.vectorized)}
              onRefresh={loadDocuments}
              isLoading={loading}
              isAdmin={true}
              onApprove={handleApproveDocument}
              onReject={handleRejectDocument}
              onVectorize={handleVectorizeDocument}
              onDeleteVector={handleDeleteDocumentVector}
              onUpdateDocument={handleUpdateDocument}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

export default AdminPage; 
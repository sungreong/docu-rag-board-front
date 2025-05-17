import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DocumentListNew from '../components/DocumentListNew';
import TagManager from '../components/TagManager';
import { useAuth } from '../utils/AuthContext';
import { documentsApi } from '../api/documentService';
import { adminApi } from '../api/adminService';
import Layout from '../components/Layout';
import EditDocument from '../components/EditDocument';

function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' or 'tags'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedDocumentForEdit, setSelectedDocumentForEdit] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 문서 벡터화 처리 함수 (관리자 전용)
  const handleVectorizeDocument = async (documentId, options = {}) => {
    if (user?.role !== 'admin') return;
    
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
    if (user?.role !== 'admin') return;
    
    try {
      await adminApi.deleteDocumentVector(documentId);
      alert('문서 벡터가 삭제되었습니다.');
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('벡터 삭제 오류:', error);
      alert('벡터 삭제 중 오류가 발생했습니다.');
    }
  };

  // 문서 벡터화 요청 함수 (일반 사용자용)
  const handleRequestVectorize = async (documentId) => {
    try {
      await documentsApi.requestVectorizeDocument(documentId);
      alert('문서 벡터화 요청이 등록되었습니다. 관리자 승인 후 처리됩니다.');
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('벡터화 요청 오류:', error);
      alert('벡터화 요청 중 오류가 발생했습니다.');
    }
  };

  // 벡터 삭제 요청 함수 (일반 사용자용)
  const handleRequestDeleteVector = async (documentId) => {
    try {
      await documentsApi.requestDeleteDocumentVector(documentId);
      alert('벡터 삭제 요청이 등록되었습니다. 관리자 승인 후 처리됩니다.');
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('벡터 삭제 요청 오류:', error);
      alert('벡터 삭제 요청 중 오류가 발생했습니다.');
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

  // 선택한 문서 삭제
  const handleDeleteSelected = async () => {
    if (!selectedDocuments.length) return;
    
    if (window.confirm(`선택한 ${selectedDocuments.length}개의 문서를 삭제하시겠습니까?`)) {
      try {
        // 순차적으로 삭제 처리
        for (const docId of selectedDocuments) {
          await documentsApi.deleteMyDocument(docId);
        }
        
        alert(`${selectedDocuments.length}개의 문서가 삭제되었습니다.`);
        setSelectedDocuments([]);
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('문서 일괄 삭제 오류:', error);
        alert('일부 문서 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 선택한 문서 벡터화 요청
  const handleRequestVectorizeSelected = async () => {
    if (!selectedDocuments.length) return;
    
    if (window.confirm(`선택한 ${selectedDocuments.length}개의 문서에 대해 벡터화를 요청하시겠습니까?`)) {
      try {
        // 순차적으로 벡터화 요청 처리
        for (const docId of selectedDocuments) {
          await documentsApi.requestVectorizeDocument(docId);
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
  const handleRequestDeleteVectorSelected = async () => {
    if (!selectedDocuments.length) return;
    
    if (window.confirm(`선택한 ${selectedDocuments.length}개의 문서의 벡터 삭제를 요청하시겠습니까?`)) {
      try {
        // 순차적으로 벡터 삭제 요청 처리
        for (const docId of selectedDocuments) {
          await documentsApi.requestDeleteDocumentVector(docId);
        }
        
        alert(`${selectedDocuments.length}개의 문서의 벡터 삭제가 요청되었습니다.`);
        setSelectedDocuments([]);
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('문서 일괄 벡터 삭제 요청 오류:', error);
        alert('일부 문서 벡터 삭제 요청 중 오류가 발생했습니다.');
      }
    }
  };

  // 문서 편집 모드 활성화
  const handleEditDocument = async (document) => {
    console.log('편집 요청된 문서:', document);
    
    if (!document || !document.id) {
      console.error('문서 ID가 없습니다:', document);
      alert('문서 정보가 올바르지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.');
      return;
    }
    
    // 문서 ID가 문자열이 아닌 경우 문자열로 변환
    const documentId = String(document.id);
    console.log('변환된 문서 ID:', documentId, '타입:', typeof documentId);
    
    try {
      // 문서 상세 정보 가져오기
      console.log(`문서 ID로 상세 정보 요청: ${documentId}`);
      const response = await documentsApi.getDocument(documentId);
      console.log('서버에서 받은 상세 정보:', response.data);
      setSelectedDocumentForEdit(response.data);
      setIsEditMode(true);
    } catch (error) {
      console.error('문서 상세 정보 가져오기 오류:', error, '문서 ID:', documentId);
      
      // 오류 발생 시 직접 받은 문서 정보로 편집 모드 진입
      console.log('오류로 인해 받은 문서 정보 그대로 사용:', document);
      alert('문서 상세 정보를 가져오는 데 실패했지만, 기본 정보로 편집을 시작합니다.');
      
      // ID가 문자열인지 확인
      const documentToEdit = {
        ...document,
        id: documentId
      };
      
      setSelectedDocumentForEdit(documentToEdit);
      setIsEditMode(true);
    }
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedDocumentForEdit(null);
  };

  // 편집 성공 처리
  const handleEditSuccess = (updatedDocument) => {
    setIsEditMode(false);
    setSelectedDocumentForEdit(null);
    setForceUpdate(prev => prev + 1); // 문서 목록 갱신
    alert('문서가 성공적으로 수정되었습니다.');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {isEditMode && selectedDocumentForEdit ? (
          <div>
            <div className="mb-4">
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                문서 목록으로 돌아가기
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">문서 편집</h1>
            <EditDocument 
              document={selectedDocumentForEdit} 
              onEditSuccess={handleEditSuccess} 
              onCancel={handleCancelEdit} 
            />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">내 문서 관리</h1>
              
              {/* 탭 메뉴 */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`${
                      activeTab === 'documents'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    문서 관리
                  </button>
                  <button
                    onClick={() => setActiveTab('tags')}
                    className={`${
                      activeTab === 'tags'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    태그 관리
                  </button>
                </nav>
              </div>

              {activeTab === 'documents' ? (
                <>
                  <p className="text-gray-600 mb-4">
                    내가 업로드한 문서들을 관리하세요. 상태를 확인하고 필요한 조치를 취할 수 있습니다.
                    승인된 문서는 공개 여부 설정에 따라 전체 문서 게시판에 표시됩니다.
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
                    {/* 선택된 문서 작업 버튼 */}
                    <div className="flex space-x-2">
                      {selectedDocuments.length > 0 && (
                        <>
                          <button
                            onClick={handleDeleteSelected}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            선택 삭제 ({selectedDocuments.length})
                          </button>
                          
                          <button
                            onClick={handleRequestVectorizeSelected}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                          >
                            선택 벡터화 요청 ({selectedDocuments.length})
                          </button>
                          
                          <button
                            onClick={handleRequestDeleteVectorSelected}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                          >
                            선택 벡터 삭제 요청 ({selectedDocuments.length})
                          </button>
                        </>
                      )}
                    </div>
                    
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

                  {/* 문서 목록 */}
                  <DocumentListNew 
                    isAdmin={user?.role === 'admin'}
                    onVectorize={user?.role === 'admin' ? handleVectorizeDocument : handleRequestVectorize}
                    onDeleteVector={user?.role === 'admin' ? handleDeleteVector : handleRequestDeleteVector}
                    onEdit={handleEditDocument}
                    initialViewType="my"  // 내 문서만 보이도록 설정
                    initialStatusFilter=""  // 모든 상태의 문서 표시
                    forceUpdate={forceUpdate}
                    onSelectDocument={handleDocumentSelect}
                    selectedDocuments={selectedDocuments}
                  />
                </>
              ) : (
                <TagManager />
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default HomePage; 
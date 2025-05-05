import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DocumentListNew from '../components/DocumentListNew';
import { useAuth } from '../utils/AuthContext';
import Layout from '../components/Layout';

function AllDocumentsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">공개 문서 게시판</h1>
          <p className="text-gray-600 mb-4">
            승인된 공개 문서를 검색하고 확인하세요. 이 페이지에는 관리자가 승인한 문서 중 공개로 설정된 문서만 표시됩니다.
            {user && ' 자신의 문서를 관리하려면 내 문서 메뉴를 이용해주세요.'}
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
            {user && (
              <Link
                to="/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                문서 업로드
              </Link>
            )}
          </div>
        </div>

        {/* 문서 목록 */}
        <DocumentListNew 
          isAdmin={user?.role === 'admin'}
          initialViewType="public"  // 공개 문서만 보이도록 설정
          initialStatusFilter="승인완료"  // 승인된 문서만 보이도록 설정
        />
      </div>
    </Layout>
  );
}

export default AllDocumentsPage; 
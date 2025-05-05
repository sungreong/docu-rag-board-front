import React, { useState } from 'react';

function SearchResults({ results }) {
  const [expandedDoc, setExpandedDoc] = useState(null);

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return '날짜 없음';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  // 문서 상세 정보 토글
  const toggleExpandDoc = (docId) => {
    if (expandedDoc === docId) {
      setExpandedDoc(null);
    } else {
      setExpandedDoc(docId);
    }
  };

  // 문서의 상태에 따른 배지 스타일
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case '승인완료':
        return 'bg-green-100 text-green-800';
      case '승인대기':
        return 'bg-yellow-100 text-yellow-800';
      case '거부됨':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 문서 유효 상태 확인
  const isDocumentValid = (doc) => {
    if (!doc.endDate) return true;
    
    const today = new Date();
    const endDate = new Date(doc.endDate);
    
    return endDate >= today;
  };

  // 파일 다운로드 처리 (모의 기능)
  const handleDownload = (fileName) => {
    // 실제로는 API 호출
    // window.location.href = `http://localhost:8000/api/download/${fileName}`;
    
    alert(`${fileName} 다운로드를 시작합니다. (모의 기능)`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-2">검색 결과</h2>
        <p className="text-sm text-gray-600">총 {results.length}개의 문서가 검색되었습니다.</p>
      </div>

      {results.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  문서 정보
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유효기간
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((doc) => (
                <React.Fragment key={doc.id}>
                  <tr className={`${!isDocumentValid(doc) ? 'bg-gray-50 text-gray-400' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <button 
                          onClick={() => toggleExpandDoc(doc.id)}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 flex items-center"
                        >
                          <span className={`mr-2 ${!isDocumentValid(doc) ? 'text-gray-400' : ''}`}>
                            {doc.title}
                          </span>
                          <svg 
                            className={`w-4 h-4 transform transition-transform ${expandedDoc === doc.id ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </button>
                      </div>
                      <div className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {doc.summary}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {doc.tags && doc.tags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              !isDocumentValid(doc) ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.startDate && doc.endDate ? (
                        <>
                          {formatDate(doc.startDate)} ~ {formatDate(doc.endDate)}
                          {!isDocumentValid(doc) && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              만료됨
                            </span>
                          )}
                        </>
                      ) : (
                        '기간 미설정'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className={`text-blue-600 hover:text-blue-900 ${!isDocumentValid(doc) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleDownload(doc.fileNames ? doc.fileNames[0] : doc.fileName)}
                        disabled={!isDocumentValid(doc)}
                      >
                        다운로드
                      </button>
                    </td>
                  </tr>

                  {/* 확장된 상세 정보 */}
                  {expandedDoc === doc.id && (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 bg-gray-50">
                        <div className="rounded-md p-4 bg-white border border-gray-200">
                          <h4 className="font-medium mb-2">요약 내용</h4>
                          <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">
                            {doc.summary || '요약 내용이 없습니다.'}
                          </p>
                          
                          <h4 className="font-medium mb-2">첨부 파일</h4>
                          <div className="space-y-2">
                            {doc.fileNames ? (
                              <ul className="space-y-1">
                                {doc.fileNames.map((fileName, idx) => (
                                  <li key={idx} className="flex items-center justify-between border rounded-md p-2">
                                    <span className="text-sm text-gray-700 flex items-center">
                                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                      </svg>
                                      {fileName}
                                    </span>
                                    <button 
                                      onClick={() => handleDownload(fileName)} 
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                      disabled={!isDocumentValid(doc)}
                                    >
                                      다운로드
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : doc.fileName ? (
                              <div className="flex items-center justify-between border rounded-md p-2">
                                <span className="text-sm text-gray-700 flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                  </svg>
                                  {doc.fileName}
                                </span>
                                <button 
                                  onClick={() => handleDownload(doc.fileName)} 
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                  disabled={!isDocumentValid(doc)}
                                >
                                  다운로드
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">첨부 파일이 없습니다.</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SearchResults; 
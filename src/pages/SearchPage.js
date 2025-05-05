import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchApi } from '../api/searchService';
import Layout from '../components/Layout';
import SearchResults from '../components/SearchResults';
import { useAuth } from '../utils/AuthContext';

function SearchPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [sortOrder, setSortOrder] = useState('relevant');
  const [searchType, setSearchType] = useState('keyword'); // 검색 유형: keyword, pattern, similar

  // URL에서 검색어 추출
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('query') || '';
    const tags = params.getAll('tag') || [];
    const sort = params.get('sort') || 'relevant';
    const type = params.get('type') || 'keyword';
    
    setSearchQuery(query);
    setSelectedTags(tags);
    setSortOrder(sort);
    setSearchType(type);
    
    if (query) {
      performSearch(query, tags, sort, type);
    }
  }, [location.search]);

  // 검색 실행 함수
  const performSearch = async (query, tags = [], sort = 'relevant', type = 'keyword') => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const filters = {
        tags: tags,
        sort_by: sort,
        search_type: type
      };
      
      const response = await searchApi.searchDocuments(query, filters);
      
      // 검색 결과 가공
      const processedResults = (response.data.results || []).map(result => {
        // highlights 속성이 있는 경우 검색어 정보도 함께 추가
        if (result.highlights && result.highlights.length > 0) {
          return {
            ...result,
            searchTerm: query // 검색어 정보 추가
          };
        }
        return result;
      });
      
      setSearchResults(processedResults);
      
      // 검색 결과에서 사용 가능한 태그 추출
      const uniqueTags = [...new Set(processedResults.flatMap(doc => doc.tags || []))];
      setAvailableTags(uniqueTags);
    } catch (error) {
      console.error('검색 오류:', error);
      setError('검색 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 양식 제출 처리
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // URL에 검색어와 필터를 반영하여 검색
    const params = new URLSearchParams();
    params.set('query', searchQuery);
    selectedTags.forEach(tag => params.append('tag', tag));
    params.set('sort', sortOrder);
    params.set('type', searchType);
    
    navigate(`/search?${params.toString()}`);
  };

  // 태그 선택 토글
  const handleTagToggle = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // 검색 결과 정렬 변경
  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
    
    // URL 업데이트
    const params = new URLSearchParams(location.search);
    params.set('sort', e.target.value);
    navigate(`/search?${params.toString()}`);
  };

  // 검색 유형 변경
  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">문서 검색</h1>
          <p className="text-gray-600 mb-4">
            원하는 키워드로 문서를 검색하세요. 검색 유형을 선택하고 태그로 결과를 필터링할 수 있습니다.
          </p>
          
          {/* 검색 양식 */}
          <div className="mb-6">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              {/* 검색 유형 선택 */}
              <div className="flex flex-wrap gap-4 mb-2">
                <div className="flex items-center">
                  <input
                    id="search-type-keyword"
                    name="search-type"
                    type="radio"
                    value="keyword"
                    checked={searchType === 'keyword'}
                    onChange={handleSearchTypeChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="search-type-keyword" className="ml-2 block text-sm text-gray-700">
                    키워드 검색
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="search-type-pattern"
                    name="search-type"
                    type="radio"
                    value="pattern"
                    checked={searchType === 'pattern'}
                    onChange={handleSearchTypeChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="search-type-pattern" className="ml-2 block text-sm text-gray-700">
                    패턴 검색
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="search-type-similar"
                    name="search-type"
                    type="radio"
                    value="similar"
                    checked={searchType === 'similar'}
                    onChange={handleSearchTypeChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="search-type-similar" className="ml-2 block text-sm text-gray-700">
                    유사 문서명 검색
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="search-type-content"
                    name="search-type"
                    type="radio"
                    value="content"
                    checked={searchType === 'content'}
                    onChange={handleSearchTypeChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="search-type-content" className="ml-2 block text-sm text-gray-700">
                    문서 내용 검색
                  </label>
                </div>
              </div>
              
              {/* 검색어 입력 필드 */}
              <div className="flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    searchType === 'pattern' 
                      ? "검색 패턴을 입력하세요 (예: 2023*, *보고서, 회의록*)" 
                      : searchType === 'similar' 
                        ? "문서명을 입력하세요 (유사한 문서명을 찾습니다)" 
                        : searchType === 'content' 
                          ? "문서 내용을 입력하세요" 
                          : "검색어를 입력하세요"
                  }
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  검색
                </button>
              </div>
              
              {/* 검색 유형 도움말 */}
              <div className="text-xs text-gray-500 italic">
                {searchType === 'pattern' && (
                  <span>패턴 검색: '*'는 여러 문자, '?'는 한 문자를 대체합니다. 예) 2023*, *계약서, 회의록_2?2?</span>
                )}
                {searchType === 'similar' && (
                  <span>유사 문서명 검색: 입력한 문서명과 유사한 이름을 가진 문서를 찾습니다.</span>
                )}
                {searchType === 'content' && (
                  <span>문서 내용 검색: 문서 내용에서 키워드와 일치하는 문서를 찾습니다. 검색 결과에 본문 미리보기를 제공합니다.</span>
                )}
              </div>
            </form>
          </div>
          
          {/* 필터 및 정렬 영역 */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* 태그 필터 */}
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-700 mb-2">태그 필터</h3>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {availableTags.length === 0 && (
                  <span className="text-sm text-gray-500">검색 결과에서 태그를 필터링할 수 있습니다.</span>
                )}
              </div>
            </div>
            
            {/* 정렬 옵션 */}
            <div className="w-60">
              <h3 className="text-sm font-medium text-gray-700 mb-2">정렬 기준</h3>
              <select
                value={sortOrder}
                onChange={handleSortChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="relevant">관련도순</option>
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="title_asc">제목 (오름차순)</option>
                <option value="title_desc">제목 (내림차순)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* 검색 결과 표시 */}
        {isLoading ? (
          <div className="flex justify-center my-8">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : searchQuery && searchResults.length === 0 ? (
          <div className="bg-yellow-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">검색 결과가 없습니다. 다른 검색어나 검색 유형을 시도해보세요.</p>
              </div>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <SearchResults 
            results={searchResults} 
            isLoading={isLoading} 
            isAdmin={user?.role === 'admin'} 
          />
        ) : null}
      </div>
    </Layout>
  );
}

export default SearchPage; 
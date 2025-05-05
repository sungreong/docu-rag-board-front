import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchService } from '../api';

function SearchBar({ onSearch }) {
  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const debounceTimerRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchHistoryRef = useRef(null);
  const [error, setError] = useState(null);

  // 로컬 스토리지에서 검색 기록 불러오기
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 검색 기록 저장
  const saveToHistory = useCallback((term) => {
    if (!term.trim()) return;
    
    const newHistory = [
      term, 
      ...searchHistory.filter(item => item !== term)
    ].slice(0, 5); // 최대 5개 항목만 유지
    
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  }, [searchHistory]);

  // 검색 처리
  const handleSearch = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      return;
    }
    
    setIsSearching(true);
    setError(null);
    saveToHistory(searchTerm);
    
    try {
      // 백엔드 API 호출
      const response = await searchService.searchByKeyword(searchTerm);
      onSearch(response.data);
    } catch (err) {
      console.error('검색 오류:', err);
      setError('검색 중 오류가 발생했습니다.');
      
      // 임시 모의 검색 결과 (백엔드 연결 실패 시)
      const mockResults = [
        { 
          id: 101, 
          title: `"${searchTerm}" 관련 문서 1`, 
          summary: `이 문서는 "${searchTerm}"에 관한 내용을 포함하고 있습니다. 샘플 검색 결과입니다.`,
          tags: ['검색', '샘플', searchTerm], 
          fileNames: ['sample1.pdf'],
          createdAt: new Date().toISOString()
        },
        { 
          id: 102, 
          title: `"${searchTerm}" 검색 결과 2`, 
          summary: `${searchTerm}에 대한 추가 정보가 담긴 문서입니다. 실제 백엔드 연결 시 이 목업 데이터는 사용되지 않습니다.`,
          tags: ['문서', '예시', searchTerm], 
          fileNames: ['sample2.docx', 'data.xlsx'],
          createdAt: new Date().toISOString()
        }
      ];
      
      onSearch(mockResults);
    } finally {
      setIsSearching(false);
    }
  }, [onSearch, saveToHistory]);

  // 검색어 입력 핸들러 (디바운싱 적용)
  const handleInputChange = (e) => {
    const value = e.target.value;
    setKeyword(value);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 500ms 동안 타이핑이 없으면 검색 실행
    if (value.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        handleSearch(value);
      }, 500);
    }
  };

  // 엔터 키 핸들러
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      if (keyword.trim()) {
        handleSearch(keyword);
      }
      
      // 검색 후 기록 닫기
      setShowHistory(false);
    }
  };

  // 검색 버튼 클릭 핸들러
  const handleSearchClick = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (keyword.trim()) {
      handleSearch(keyword);
    }
    
    setShowHistory(false);
  };

  // 검색 기록 항목 클릭 핸들러
  const handleHistoryItemClick = (term) => {
    setKeyword(term);
    handleSearch(term);
    setShowHistory(false);
  };

  // 검색 기록 항목 삭제 핸들러
  const handleRemoveHistoryItem = (e, term) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(item => item !== term);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // 검색창 외부 클릭 시 검색 기록 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchHistoryRef.current && 
        !searchHistoryRef.current.contains(e.target) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(e.target)
      ) {
        setShowHistory(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <input
          ref={searchInputRef}
          type="text"
          value={keyword}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowHistory(true)}
          className="w-full p-3 pl-10 border border-gray-300 rounded-l focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="검색어를 입력하세요..."
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <button
          onClick={handleSearchClick}
          disabled={isSearching || !keyword.trim()}
          className={`px-4 py-3 font-medium rounded-r ${
            isSearching || !keyword.trim()
              ? 'bg-gray-400 cursor-not-allowed text-white' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSearching ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              검색 중...
            </div>
          ) : '검색'}
        </button>
      </div>

      {/* 검색 기록 드롭다운 */}
      {showHistory && searchHistory.length > 0 && (
        <div
          ref={searchHistoryRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
        >
          <ul className="py-1">
            <li className="px-3 py-2 text-xs text-gray-500 border-b">검색 기록</li>
            {searchHistory.map((term, index) => (
              <li
                key={index}
                onClick={() => handleHistoryItemClick(term)}
                className="px-3 py-2 flex justify-between items-center hover:bg-gray-100 cursor-pointer"
              >
                <span className="text-sm text-gray-700">{term}</span>
                <button
                  onClick={(e) => handleRemoveHistoryItem(e, term)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

export default SearchBar; 
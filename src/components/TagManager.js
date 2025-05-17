import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { tagsApi } from '../api/tagService';

function TagManager() {
  const { user } = useAuth();
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState({ name: '', color: '#3B82F6', description: '' });
  const [editingTag, setEditingTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDescription, setShowDescription] = useState(false);  // 설명 입력 필드 표시 여부

  // 태그 목록 불러오기
  const fetchTags = async () => {
    try {
      setIsLoading(true);
      const response = await tagsApi.getPersonalTags({ 
        search: searchQuery,
        skip: 0,
        limit: 100
      });
      setTags(response.data);
    } catch (error) {
      console.error('태그 목록 불러오기 실패:', error);
      alert('태그 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [searchQuery]);

  // 태그 생성
  const handleCreateTag = async (e) => {
    e.preventDefault();
    try {
      const tagData = {
        name: newTag.name,
        color: newTag.color,
        description: newTag.description || undefined
      };
      await tagsApi.createPersonalTag(tagData);
      setNewTag({ name: '', color: '#3B82F6', description: '' });
      setShowDescription(false);
      fetchTags();
      alert('태그가 성공적으로 생성되었습니다.');
    } catch (error) {
      console.error('태그 생성 실패:', error);
      alert(error.response?.data?.detail || '태그 생성에 실패했습니다.');
    }
  };

  // 태그 수정
  const handleUpdateTag = async (e) => {
    e.preventDefault();
    if (!editingTag) return;

    try {
      const tagData = {
        name: editingTag.name,
        color: editingTag.color,
        description: editingTag.description || undefined
      };
      await tagsApi.updatePersonalTag(editingTag.id, tagData);
      setEditingTag(null);
      fetchTags();
      alert('태그가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('태그 수정 실패:', error);
      alert(error.response?.data?.detail || '태그 수정에 실패했습니다.');
    }
  };

  // 태그 삭제
  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('이 태그를 삭제하시겠습니까?')) return;

    try {
      await tagsApi.deletePersonalTag(tagId);
      fetchTags();
      alert('태그가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('태그 삭제 실패:', error);
      alert(error.response?.data?.detail || '태그 삭제에 실패했습니다.');
    }
  };

  // 검색된 태그 필터링
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">내 태그 관리</h2>

      {/* 태그 검색 */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="태그 검색..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 새 태그 생성 폼 */}
      {!editingTag && (
        <form onSubmit={handleCreateTag} className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                placeholder="새 태그 이름"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <input
                type="color"
                value={newTag.color}
                onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                className="w-20 h-10 p-1 border border-gray-300 rounded-md"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                태그 추가
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDescription(!showDescription)}
                className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                {showDescription ? '설명 숨기기' : '설명 추가 (선택사항)'}
              </button>
            </div>

            {showDescription && (
              <textarea
                value={newTag.description}
                onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                placeholder="태그에 대한 설명을 입력하세요 (선택사항)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows="2"
              />
            )}
          </div>
        </form>
      )}

      {/* 태그 수정 폼 */}
      {editingTag && (
        <form onSubmit={handleUpdateTag} className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={editingTag.name}
                onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                placeholder="태그 이름"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <input
                type="color"
                value={editingTag.color}
                onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                className="w-20 h-10 p-1 border border-gray-300 rounded-md"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                수정 완료
              </button>
              <button
                type="button"
                onClick={() => setEditingTag(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                취소
              </button>
            </div>

            <textarea
              value={editingTag.description || ''}
              onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
              placeholder="태그에 대한 설명을 입력하세요 (선택사항)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows="2"
            />
          </div>
        </form>
      )}

      {/* 태그 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-4">로딩 중...</div>
        ) : filteredTags.length === 0 ? (
          <div className="col-span-full text-center py-4 text-gray-500">
            {searchQuery ? '검색 결과가 없습니다.' : '등록된 태그가 없습니다.'}
          </div>
        ) : (
          filteredTags.map(tag => (
            <div
              key={tag.id}
              className="flex flex-col p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-medium">{tag.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTag(tag)}
                    className="p-2 text-blue-600 hover:text-blue-800"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </div>
              </div>
              {tag.description && (
                <div className="mt-2 text-sm text-gray-600">
                  {tag.description}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TagManager; 
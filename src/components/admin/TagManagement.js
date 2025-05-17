import React, { useState, useEffect } from 'react';
import { tagsApi } from '../../api/tags';


const TagManagement = () => {
  const [systemTags, setSystemTags] = useState([]);
  const [userTags, setUserTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('system'); // 'system' or 'user'
  const [editingTag, setEditingTag] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 태그 로드
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setIsLoading(true);
    try {
      // 시스템 태그와 개인 태그 모두 로드
      const systemTagsData = await tagsApi.getSystemTags();
      const personalTagsData = await tagsApi.getPersonalTags();
      setSystemTags(systemTagsData);
      setUserTags(personalTagsData);
    } catch (error) {
      console.error('태그 로드 실패:', error);
      alert('태그 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 시스템 태그 생성
  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await tagsApi.createSystemTag({
        name: newTagName.trim(),
        description: newTagDescription.trim(),
        color: newTagColor
      });
      setNewTagName('');
      setNewTagDescription('');
      setNewTagColor('#3B82F6');
      loadTags();
      alert('시스템 태그가 생성되었습니다.');
    } catch (error) {
      console.error('태그 생성 오류:', error);
      alert('태그 생성 중 오류가 발생했습니다.');
    }
  };

  // 시스템 태그 수정
  const handleUpdateTag = async (tag) => {
    try {
      await tagsApi.updateSystemTag(tag.id, {
        name: tag.name,
        description: tag.description,
        color: tag.color
      });
      setEditingTag(null);
      loadTags();
      alert('태그가 수정되었습니다.');
    } catch (error) {
      console.error('태그 수정 오류:', error);
      alert('태그 수정 중 오류가 발생했습니다.');
    }
  };

  // 시스템 태그 삭제
  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('이 태그를 삭제하시겠습니까?')) return;

    try {
      await tagsApi.deleteSystemTag(tagId);
      loadTags();
      alert('태그가 삭제되었습니다.');
    } catch (error) {
      console.error('태그 삭제 오류:', error);
      alert('태그 삭제 중 오류가 발생했습니다.');
    }
  };

  // 검색된 태그 필터링
  const filteredTags = (activeTab === 'system' ? systemTags : userTags)
    .filter(tag => 
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">태그 관리</h2>
        
        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('system')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'system'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              시스템 태그
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'user'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              사용자 태그
            </button>
          </nav>
        </div>

        {/* 검색 필드 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="태그 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* 새 시스템 태그 생성 폼 (시스템 태그 탭에서만 표시) */}
        {activeTab === 'system' && (
          <form onSubmit={handleCreateTag} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-4">새 시스템 태그 생성</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  태그 이름
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="태그 이름 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <input
                  type="text"
                  value={newTagDescription}
                  onChange={(e) => setNewTagDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="태그 설명 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  색상
                </label>
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-full h-10 p-1 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              태그 생성
            </button>
          </form>
        )}

        {/* 태그 목록 */}
        {isLoading ? (
          <div className="text-center py-4">로딩 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    태그 이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    색상
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성일
                  </th>
                  {activeTab === 'system' && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTags.map((tag) => (
                  <tr key={tag.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingTag?.id === tag.id ? (
                        <input
                          type="text"
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({...editingTag, name: e.target.value})}
                          className="w-full p-1 border border-gray-300 rounded-md"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{tag.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingTag?.id === tag.id ? (
                        <input
                          type="text"
                          value={editingTag.description || ''}
                          onChange={(e) => setEditingTag({...editingTag, description: e.target.value})}
                          className="w-full p-1 border border-gray-300 rounded-md"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{tag.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingTag?.id === tag.id ? (
                        <input
                          type="color"
                          value={editingTag.color || '#3B82F6'}
                          onChange={(e) => setEditingTag({...editingTag, color: e.target.value})}
                          className="w-20 h-8 p-1 border border-gray-300 rounded-md"
                        />
                      ) : (
                        <div 
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: tag.color || '#3B82F6' }}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(tag.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    {activeTab === 'system' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingTag?.id === tag.id ? (
                          <div className="space-x-2">
                            <button
                              onClick={() => handleUpdateTag(editingTag)}
                              className="text-green-600 hover:text-green-900"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingTag(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="space-x-2">
                            <button
                              onClick={() => setEditingTag(tag)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagManagement; 
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/adminService';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'inactive'
  const [notification, setNotification] = useState(null);

  // 사용자 목록 가져오기
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await adminApi.getAllUsers();
      setUsers(response.data);
    } catch (err) {
      console.error('사용자 로드 오류:', err);
      setError('사용자 목록을 불러오는 중 오류가 발생했습니다.');
      
      // 백엔드 연결 안될 경우 모의 데이터
      const mockUsers = [
        { 
          id: '1', 
          email: 'user1@example.com',
          name: '홍길동',
          contact_email: 'hong.gd@company.com',
          role: 'user',
          is_approved: true,
          is_active: true,
          created_at: new Date(2023, 1, 15).toISOString()
        },
        { 
          id: '2', 
          email: 'user2@example.com',
          name: '김철수',
          contact_email: null,
          role: 'user',
          is_approved: false,
          is_active: true,
          created_at: new Date(2023, 5, 20).toISOString()
        },
        { 
          id: '3', 
          email: 'user3@example.com',
          name: '이영희',
          contact_email: 'lee.yh@gmail.com',
          role: 'user',
          is_approved: true,
          is_active: false,
          created_at: new Date(2023, 3, 10).toISOString()
        },
      ];
      
      setUsers(mockUsers);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 필터링
  useEffect(() => {
    if (filter === 'all') {
      setFilteredUsers(users);
    } else if (filter === 'pending') {
      setFilteredUsers(users.filter(user => !user.is_approved && user.is_active));
    } else if (filter === 'approved') {
      setFilteredUsers(users.filter(user => user.is_approved && user.is_active));
    } else if (filter === 'inactive') {
      setFilteredUsers(users.filter(user => !user.is_active));
    }
  }, [users, filter]);

  // 사용자 승인 처리
  const handleApproveUser = async (userId) => {
    try {
      await adminApi.approveUser(userId);
      showNotification('사용자가 성공적으로 승인되었습니다.');
      fetchUsers(); // 목록 갱신
    } catch (error) {
      console.error('사용자 승인 오류:', error);
      setError('사용자 승인 중 오류가 발생했습니다.');
    }
  };

  // 사용자 비활성화 처리
  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('해당 사용자를 비활성화하시겠습니까? 비활성화된 사용자는 로그인할 수 없습니다.')) {
      return;
    }
    
    try {
      await adminApi.deactivateUser(userId);
      showNotification('사용자가 비활성화되었습니다.');
      fetchUsers(); // 목록 갱신
    } catch (error) {
      console.error('사용자 비활성화 오류:', error);
      setError('사용자 비활성화 중 오류가 발생했습니다.');
    }
  };

  // 사용자 활성화 처리
  const handleActivateUser = async (userId) => {
    try {
      await adminApi.activateUser(userId);
      showNotification('사용자가 활성화되었습니다.');
      fetchUsers(); // 목록 갱신
    } catch (error) {
      console.error('사용자 활성화 오류:', error);
      setError('사용자 활성화 중 오류가 발생했습니다.');
    }
  };
  
  // 알림 표시 함수
  const showNotification = (message) => {
    setNotification(message);
    // 3초 후 알림 자동 삭제
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">사용자 관리</h2>
      
      {/* 알림 메시지 */}
      {notification && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{notification}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 필터링 버튼 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'pending'
              ? 'bg-yellow-100 text-yellow-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          승인 대기
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'approved'
              ? 'bg-green-100 text-green-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          승인됨
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'inactive'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          비활성화
        </button>
      </div>

      {/* 사용자 목록 */}
      {isLoading ? (
        <div className="flex justify-center my-8">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이메일
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  연락처
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    {filter === 'pending' 
                      ? '승인 대기 중인 사용자가 없습니다.'
                      : filter === 'inactive' 
                        ? '비활성화된 사용자가 없습니다.'
                        : '사용자가 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.contact_email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!user.is_active ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          비활성화
                        </span>
                      ) : user.is_approved ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          승인됨
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          승인 대기
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.role !== 'admin' && (
                        <div className="flex space-x-2">
                          {!user.is_approved && user.is_active && (
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded"
                            >
                              승인
                            </button>
                          )}
                          
                          {user.is_active ? (
                            <button
                              onClick={() => handleDeactivateUser(user.id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded"
                            >
                              비활성화
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateUser(user.id)}
                              className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded"
                            >
                              활성화
                            </button>
                          )}
                        </div>
                      )}
                      {user.role === 'admin' && (
                        <span className="text-gray-400">(관리자)</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserManagement; 
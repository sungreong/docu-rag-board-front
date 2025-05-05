import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import UploadForm from '../components/UploadForm';

function UploadPage() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadSuccess = (uploadedDocument) => {
    // 업로드 성공 시 홈페이지로 리다이렉트
    navigate('/');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">문서 업로드</h1>
          <p className="text-gray-600 mb-8">
            새로운 문서를 업로드하세요. 문서는 관리자의 승인 후 공개 여부에 따라 다른 사용자에게 표시됩니다.
            승인된 후에도 벡터화 처리가 필요한 경우 별도로 요청할 수 있습니다.
          </p>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4 bg-blue-50 p-4 rounded-md">
              <h3 className="text-blue-800 font-medium mb-2">문서 업로드 안내</h3>
              <ul className="list-disc pl-5 text-blue-700 text-sm">
                <li>지원 파일 형식: PDF, DOCX, TXT, PPT</li>
                <li>최대 파일 크기: 50MB</li>
                <li>태그를 추가하면 검색이 더 쉬워집니다.</li>
                <li>업로드 후 반드시 관리자 승인이 필요합니다.</li>
                <li>벡터화가 필요한 경우 승인 후 별도로 요청할 수 있습니다.</li>
              </ul>
            </div>
            
            <UploadForm onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default UploadPage; 
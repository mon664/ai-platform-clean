'use client';

import { useState, useEffect } from 'react';

interface FileInfo {
  filename: string;
  size: number;
  size_mb: number;
  date: string;
  url: string;
}

interface FileManagerResponse {
  success: boolean;
  files: FileInfo[];
  total_count: number;
  ftp_info: {
    host: string;
    port: number;
  };
}

export default function FileManager() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://autoblog-python-production.up.railway.app/api/files/list');

      if (!response.ok) {
        throw new Error('파일 목록을 불러오는데 실패했습니다.');
      }

      const data: FileManagerResponse = await response.json();

      if (data.success) {
        setFiles(data.files);
      } else {
        throw new Error('파일 목록을 가져오는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filename: string) => {
    try {
      const response = await fetch(`https://autoblog-python-production.up.railway.app/api/files/download/${encodeURIComponent(filename)}`);

      if (!response.ok) {
        throw new Error('파일 다운로드에 실패했습니다.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('다운로드 실패: ' + err.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">📁</div>
          <h2 className="text-2xl font-bold text-white">파일 관리</h2>
        </div>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">파일 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">📁</div>
          <h2 className="text-2xl font-bold text-white">파일 관리</h2>
        </div>
        <div className="text-red-400 text-center">
          <p>❌ {error}</p>
          <button
            onClick={fetchFiles}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            🔄 다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">📁</div>
        <h2 className="text-2xl font-bold text-white">파일 관리</h2>
        <span className="ml-auto text-green-400">{files.length}개 파일</span>
      </div>

      {files.length === 0 ? (
        <div className="text-center text-white py-8">
          <p>저장된 파일이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{file.filename}</h3>
                  <div className="text-sm text-gray-300 mt-1">
                    <span>{formatFileSize(file.size)}</span>
                    <span className="mx-2">•</span>
                    <span>{file.date}</span>
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(file.filename)}
                  className="ml-4 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ⬇️ 다운로드
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <button
          onClick={fetchFiles}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm"
        >
          🔄 목록 새로고침
        </button>
      </div>
    </div>
  );
}
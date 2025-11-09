'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <p>에디터를 불러오는 중...</p>,
});

export default function WriteBlogPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const quillRef = useRef<any>(null);

  // 이미지 업로드 핸들러
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // 이미지를 base64로 변환
      const reader = new FileReader();
      reader.onload = () => {
        const quill = quillRef.current?.getEditor();
        const range = quill?.getSelection();
        if (range && reader.result) {
          quill.insertEmbed(range.index, 'image', reader.result);
        }
      };
      reader.readAsDataURL(file);
    };
  };

  // Quill 에디터 설정
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'script',
    'list',
    'bullet',
    'indent',
    'align',
    'blockquote',
    'code-block',
    'link',
    'image',
    'video',
  ];

  // 임시저장 (로컬 스토리지)
  const saveDraft = () => {
    localStorage.setItem('blog-draft', JSON.stringify({ title, content }));
    setStatus('✅ 임시저장 완료');
    setTimeout(() => setStatus(''), 2000);
  };

  // 임시저장 불러오기
  useEffect(() => {
    const draft = localStorage.getItem('blog-draft');
    if (draft) {
      try {
        const { title: savedTitle, content: savedContent } = JSON.parse(draft);
        if (savedTitle || savedContent) {
          const load = confirm('임시저장된 글이 있습니다. 불러오시겠습니까?');
          if (load) {
            setTitle(savedTitle);
            setContent(savedContent);
          }
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // 자동 저장 (5초마다)
  useEffect(() => {
    if (!title && !content) return;

    const timer = setInterval(() => {
      saveDraft();
    }, 30000); // 30초마다

    return () => clearInterval(timer);
  }, [title, content]);

  // 게시글 발행
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!content.trim() || content === '<p><br></p>') {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setStatus('발행 중...');

    try {
      const response = await fetch('/api/blog/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus('✅ 게시글이 발행되었습니다!');
        localStorage.removeItem('blog-draft');

        setTimeout(() => {
          window.location.href = `/blog/${data.slug}`;
        }, 1500);
      } else {
        setStatus('❌ 발행 실패');
        setIsSaving(false);
      }
    } catch (error) {
      setStatus('❌ 오류 발생');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 툴바 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <a href="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
              ← 목록으로
            </a>

            <div className="flex items-center gap-3">
              {status && (
                <span className="text-sm text-gray-600">{status}</span>
              )}

              <button
                type="button"
                onClick={saveDraft}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isSaving}
              >
                임시저장
              </button>

              <button
                onClick={handleSubmit}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                발행하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 에디터 영역 */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 제목 입력 */}
          <div className="border-b border-gray-200">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-6 py-4 text-3xl font-bold border-none focus:outline-none focus:ring-0 placeholder-gray-300"
              placeholder="제목을 입력하세요"
              disabled={isSaving}
            />
          </div>

          {/* Quill 에디터 */}
          <div className="quill-wrapper">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              formats={formats}
              placeholder="이야기를 시작하세요..."
              className="blog-editor"
            />
          </div>
        </div>

        {/* 도움말 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 에디터 사용 팁</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 이미지: 툴바의 이미지 아이콘을 클릭하거나 복사-붙여넣기</li>
            <li>• 자동 저장: 30초마다 자동으로 임시저장됩니다</li>
            <li>• 단축키: Ctrl+B (굵게), Ctrl+I (기울임), Ctrl+U (밑줄)</li>
            <li>• 링크: 텍스트 선택 후 링크 아이콘 클릭</li>
          </ul>
        </div>
      </div>

      <style jsx global>{`
        .blog-editor .ql-container {
          min-height: 500px;
          font-size: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .blog-editor .ql-editor {
          min-height: 500px;
          padding: 24px;
        }

        .blog-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }

        .blog-editor .ql-toolbar {
          border: none;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .blog-editor .ql-container {
          border: none;
        }

        .blog-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 16px 0;
        }

        .quill-wrapper {
          background: white;
        }
      `}</style>
    </div>
  );
}

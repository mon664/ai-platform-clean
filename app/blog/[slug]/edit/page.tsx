'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <p>에디터를 불러오는 중...</p>,
});

export default function EditBlogPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const quillRef = useRef<any>(null);
  const params = useParams();
  const slug = params.slug as string;

  // 데이터 불러오기
  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/blog/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setTitle(data.post.title);
          setContent(data.post.content);
        } else {
          setStatus('❌ 게시글을 불러오는데 실패했습니다.');
        }
      } catch (error) {
        setStatus('❌ 오류 발생');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // 이미지 업로드 핸들러 (기존과 동일)
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

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

  // 게시글 수정
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
    setStatus('수정 중...');

    try {
      const response = await fetch(`/api/blog/${slug}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        }
      );

      if (response.ok) {
        setStatus('✅ 게시글이 수정되었습니다!');
        setTimeout(() => {
          window.location.href = `/blog/${slug}`;
        }, 1500);
      } else {
        setStatus('❌ 수정 실패');
        setIsSaving(false);
      }
    } catch (error) {
      setStatus('❌ 오류 발생');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-20">게시글을 불러오는 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 툴바 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <a href={`/blog/${slug}`} className="text-gray-600 hover:text-gray-900 transition-colors">
              ← 게시글로 돌아가기
            </a>

            <div className="flex items-center gap-3">
              {status && (
                <span className="text-sm text-gray-600">{status}</span>
              )}

              <button
                onClick={handleSubmit}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                수정하기
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
      </div>

      <style jsx global>{`
        .blog-editor .ql-container {
          min-height: 500px;
          font-size: 16px;
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

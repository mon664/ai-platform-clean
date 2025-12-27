'use client';

import { useEffect, useRef } from 'react';

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function BlogEditor({ content, onChange, placeholder = '' }: BlogEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // 포맷 버튼 핸들러
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const insertHtml = (html: string) => {
    document.execCommand('insertHTML', false, html);
    handleInput();
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* 툴바 */}
      <div className="bg-slate-700 border-b border-slate-600 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm font-bold"
          title="굵게"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm italic"
          title="기울임"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm underline"
          title="밑줄"
        >
          U
        </button>
        <div className="w-px bg-slate-500 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h1>')}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm"
          title="제목1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h2>')}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm"
          title="제목2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h3>')}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm"
          title="제목3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<p>')}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm"
          title="본문"
        >
          P
        </button>
        <div className="w-px bg-slate-500 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm"
          title="글머리 기호"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm"
          title="번호 매기기"
        >
          1.
        </button>
        <div className="w-px bg-slate-500 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm"
          title="왼쪽 정렬"
        >
          ⬅
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm"
          title="가운데 정렬"
        >
          ⬌
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm"
          title="오른쪽 정렬"
        >
          ➡
        </button>
        <div className="w-px bg-slate-500 mx-1" />
        <button
          type="button"
          onClick={() => {
            const url = prompt('이미지 URL을 입력하세요:');
            if (url) {
              insertHtml(`<img src="${url}" alt="이미지" class="max-w-full rounded-lg my-4" />`);
            }
          }}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm"
          title="이미지 추가"
        >
          🖼️
        </button>
        <button
          type="button"
          onClick={() => {
            const url = prompt('링크 URL을 입력하세요:');
            if (url) {
              execCommand('createLink', url);
            }
          }}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm"
          title="링크 추가"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => {
            const code = prompt('HTML 코드를 입력하세요:');
            if (code) {
              insertHtml(code);
            }
          }}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
          title="HTML 추가"
        >
          &lt;/&gt;
        </button>
      </div>

      {/* 에디터 영역 */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: content }}
        className="min-h-[400px] p-4 bg-slate-900 text-white focus:outline-none prose prose-invert max-w-none"
        style={{ whiteSpace: 'pre-wrap' }}
        data-placeholder={placeholder}
      />

      <style jsx global>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #6b7280;
        }
        [contenteditable] img {
          max-width: 100%;
          border-radius: 8px;
          margin: 1rem 0;
        }
        [contenteditable] a {
          color: #60a5fa;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

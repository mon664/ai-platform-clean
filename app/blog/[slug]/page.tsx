'use client';

import { useEffect, useState } from 'react';
import { marked } from 'marked';

interface Post {
  id: number;
  slug: string;
  title: string;
  content: string;
  created_at: string;
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${params.slug}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setPost(data.post);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-2xl text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404 - 페이지를 찾을 수 없습니다</h1>
          <p className="text-gray-400 mb-8">요청하신 게시물을 찾을 수 없습니다.</p>
          <a href="/blog" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
            블로그 목록으로
          </a>
        </div>
      </div>
    );
  }

  const htmlContent = marked(post.content);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="bg-gray-800 rounded-xl p-8">
          <div className="mb-8 border-b border-gray-700 pb-6">
            <h1 className="text-4xl font-bold mb-4 text-gray-100">{post.title}</h1>
            <div className="flex justify-between items-center">
              <p className="text-gray-400">
                {new Date(post.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <a href={`/blog/${post.slug}/edit`} className="text-sm text-blue-400 hover:text-blue-300">
                수정
              </a>
            </div>
          </div>

          <div
            className="prose prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          <div className="mt-12 pt-6 border-t border-gray-700">
            <a
              href="/blog"
              className="inline-block px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              ← 목록으로 돌아가기
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}

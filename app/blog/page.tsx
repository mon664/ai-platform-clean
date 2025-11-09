'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Post {
  id: number;
  slug: string;
  title: string;
  created_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog/list')
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
            개발 블로그
          </h1>
          <a
            href="/blog/write"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            ✍️ 글쓰기
          </a>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-400">로딩 중...</p>
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id}>
                <div className="group bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-2 p-6">
                  <h2 className="text-2xl font-bold mb-3 text-gray-100 group-hover:text-blue-400 transition-colors duration-300">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500">아직 게시물이 없습니다.</p>
            <p className="mt-4 text-gray-400">첫 번째 게시물을 작성해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

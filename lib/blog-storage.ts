import Redis from 'ioredis';

// Redis 클라이언트 초기화
const redis = new Redis(process.env.REDIS_URL || '');

export interface BlogPost {
  slug: string;
  title: string;
  content: string;
  createdAt: string;
}

// 제목을 URL-safe slug로 변환
export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now();
}

// 글 생성
export async function createPost(title: string, content: string): Promise<BlogPost> {
  const slug = createSlug(title);
  const post: BlogPost = {
    slug,
    title,
    content,
    createdAt: new Date().toISOString(),
  };

  // Redis에 포스트 저장 (JSON 문자열로)
  await redis.set(`blog:${slug}`, JSON.stringify(post));

  // 포스트 목록에 slug 추가
  await redis.lpush('blog:list', slug);

  return post;
}

// 글 목록 조회
export async function listPosts(): Promise<BlogPost[]> {
  // 포스트 slug 목록 조회
  const slugs = await redis.lrange('blog:list', 0, -1);

  if (!slugs || slugs.length === 0) {
    return [];
  }

  // 각 slug에 대한 포스트 조회
  const posts: BlogPost[] = [];
  for (const slug of slugs) {
    const postJson = await redis.get(`blog:${slug}`);
    if (postJson) {
      const post = JSON.parse(postJson) as BlogPost;
      posts.push(post);
    }
  }

  // 최신순 정렬
  return posts.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// 특정 글 조회
export async function getPost(slug: string): Promise<BlogPost | null> {
  const postJson = await redis.get(`blog:${slug}`);
  if (!postJson) {
    return null;
  }
  return JSON.parse(postJson) as BlogPost;
}

// 글 수정
export async function updatePost(slug: string, title: string, content: string): Promise<BlogPost | null> {
  const existingPost = await getPost(slug);

  if (!existingPost) {
    return null;
  }

  const updatedPost: BlogPost = {
    ...existingPost,
    title,
    content,
  };

  await redis.set(`blog:${slug}`, JSON.stringify(updatedPost));
  return updatedPost;
}

// 글 삭제
export async function deletePost(slug: string): Promise<boolean> {
  const post = await getPost(slug);

  if (!post) {
    return false;
  }

  // 포스트 삭제
  await redis.del(`blog:${slug}`);

  // 목록에서 slug 제거
  await redis.lrem('blog:list', 1, slug);

  return true;
}

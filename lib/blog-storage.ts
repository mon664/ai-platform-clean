import { sql } from '@vercel/postgres';

// Postgres 클라이언트 초기화
const postgresUrl = process.env.POSTGRES_URL;
if (!postgresUrl) {
  console.warn('POSTGRES_URL environment variable is not set');
}

export interface BlogPost {
  id?: number;
  slug: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
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

  try {
    const result = await sql`
      INSERT INTO blog_posts (slug, title, content)
      VALUES (${slug}, ${title}, ${content})
      RETURNING id, slug, title, content, created_at, updated_at
    `;

    if (result.rows.length > 0) {
      return result.rows[0] as BlogPost;
    }

    throw new Error('Failed to create blog post');
  } catch (error) {
    console.error('Failed to create post:', error);
    throw error;
  }
}

// 글 목록 조회
export async function listPosts(): Promise<BlogPost[]> {
  try {
    const result = await sql`
      SELECT id, slug, title, content, created_at, updated_at
      FROM blog_posts
      ORDER BY created_at DESC
    `;

    return result.rows as BlogPost[];
  } catch (error) {
    console.error('Failed to list posts:', error);
    throw error;
  }
}

// 특정 글 조회
export async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const result = await sql`
      SELECT id, slug, title, content, created_at, updated_at
      FROM blog_posts
      WHERE slug = ${slug}
    `;

    if (result.rows.length > 0) {
      return result.rows[0] as BlogPost;
    }

    return null;
  } catch (error) {
    console.error('Failed to get post:', error);
    throw error;
  }
}

// 글 수정
export async function updatePost(slug: string, title: string, content: string): Promise<BlogPost | null> {
  try {
    const result = await sql`
      UPDATE blog_posts
      SET title = ${title}, content = ${content}, updated_at = NOW()
      WHERE slug = ${slug}
      RETURNING id, slug, title, content, created_at, updated_at
    `;

    if (result.rows.length > 0) {
      return result.rows[0] as BlogPost;
    }

    return null;
  } catch (error) {
    console.error('Failed to update post:', error);
    throw error;
  }
}

// 글 삭제
export async function deletePost(slug: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM blog_posts WHERE slug = ${slug}
    `;

    return result.rowCount > 0;
  } catch (error) {
    console.error('Failed to delete post:', error);
    throw error;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create blog_posts table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC)
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

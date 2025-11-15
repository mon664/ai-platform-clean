import { google } from 'googleapis';

export interface BlogPost {
  title: string;
  content: string;
  labels?: string[];
  isDraft?: boolean;
}

export interface BloggerBlog {
  id: string;
  name: string;
  url: string;
  description?: string;
}

export class BloggerAPI {
  private blogger: any;
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_BLOGGER_CLIENT_ID,
      process.env.GOOGLE_BLOGGER_CLIENT_SECRET,
      process.env.GOOGLE_BLOGGER_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
    );

    this.blogger = google.blogger({
      version: 'v3',
      auth: this.oauth2Client
    });
  }

  /**
   * Google OAuth 인증 URL 생성
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/blogger'],
      prompt: 'consent'
    });
  }

  /**
   * OAuth 코드로 토큰 받기
   */
  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getAccessToken(code);
    return tokens;
  }

  /**
   * 저장된 토큰으로 인증 설정
   */
  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * 사용자의 블로그 목록 가져오기
   */
  async listBlogs(): Promise<BloggerBlog[]> {
    try {
      const response = await this.blogger.blogs.listByUser({
        userId: 'self'
      });

      return response.data.items?.map((blog: any) => ({
        id: blog.id,
        name: blog.name,
        url: blog.url,
        description: blog.description
      })) || [];
    } catch (error) {
      console.error('Error listing blogs:', error);
      throw new Error('Failed to fetch blogs');
    }
  }

  /**
   * 새 블로그 포스트 생성
   */
  async createPost(blogId: string, post: BlogPost): Promise<any> {
    try {
      const response = await this.blogger.posts.insert({
        blogId,
        requestBody: {
          title: post.title,
          content: post.content,
          labels: post.labels || ['AI Generated'],
          status: post.isDraft ? 'DRAFT' : 'LIVE'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create blog post');
    }
  }

  /**
   * 블로그 포스트 수정
   */
  async updatePost(blogId: string, postId: string, post: Partial<BlogPost>): Promise<any> {
    try {
      const response = await this.blogger.posts.patch({
        blogId,
        postId,
        requestBody: post
      });

      return response.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw new Error('Failed to update blog post');
    }
  }

  /**
   * 블로그 포스트 삭제
   */
  async deletePost(blogId: string, postId: string): Promise<void> {
    try {
      await this.blogger.posts.delete({
        blogId,
        postId
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      throw new Error('Failed to delete blog post');
    }
  }

  /**
   * 블로그 포스트 목록 가져오기
   */
  async listPosts(blogId: string, maxResults: number = 10): Promise<any[]> {
    try {
      const response = await this.blogger.posts.list({
        blogId,
        maxResults,
        status: 'LIVE'
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error listing posts:', error);
      throw new Error('Failed to fetch posts');
    }
  }

  /**
   * 특정 포스트 가져오기
   */
  async getPost(blogId: string, postId: string): Promise<any> {
    try {
      const response = await this.blogger.posts.get({
        blogId,
        postId
      });

      return response.data;
    } catch (error) {
      console.error('Error getting post:', error);
      throw new Error('Failed to fetch post');
    }
  }
}
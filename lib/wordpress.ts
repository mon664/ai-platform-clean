// WordPress REST API client types
export interface WordPressConfig {
  siteUrl: string;  // e.g., https://example.com
  username: string;
  applicationPassword: string;  // WordPress Application Password
}

export interface WordPressPost {
  id?: number;
  title: string;
  content: string;
  status?: 'draft' | 'publish' | 'private' | 'pending';
  slug?: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  excerpt?: string;
}

export interface WordPressMedia {
  id: number;
  url: string;
  link: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
}

// WordPress REST API Client
export class WordPressClient {
  private config: WordPressConfig;
  private baseUrl: string;

  constructor(config: WordPressConfig) {
    this.config = config;
    // Remove trailing slash and ensure proper URL format
    const cleanUrl = config.siteUrl.replace(/\/$/, '');
    this.baseUrl = `${cleanUrl}/wp-json/wp/v2`;
  }

  private get authHeader(): string {
    const credentials = Buffer.from(
      `${this.config.username}:${this.config.applicationPassword}`
    ).toString('base64');
    return `Basic ${credentials}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WordPress API Error:', response.status, errorText);
        throw new Error(
          `WordPress API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('WordPress request failed:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/users/me');
      return true;
    } catch (error) {
      console.error('WordPress connection test failed:', error);
      return false;
    }
  }

  // Create a new post
  async createPost(post: WordPressPost): Promise<WordPressPost> {
    return this.request<WordPressPost>('/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: post.title,
        content: post.content,
        status: post.status || 'draft',
        slug: post.slug,
        categories: post.categories,
        tags: post.tags,
        featured_media: post.featured_media,
        excerpt: post.excerpt,
      }),
    });
  }

  // Update an existing post
  async updatePost(id: number, post: Partial<WordPressPost>): Promise<WordPressPost> {
    return this.request<WordPressPost>(`/posts/${id}`, {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  // Get a post by ID
  async getPost(id: number): Promise<WordPressPost> {
    return this.request<WordPressPost>(`/posts/${id}`);
  }

  // List posts
  async listPosts(params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }): Promise<WordPressPost[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    return this.request<WordPressPost[]>(`/posts${queryString ? `?${queryString}` : ''}`);
  }

  // Upload an image
  async uploadImage(
    imageUrl: string,
    filename?: string,
    alt?: string
  ): Promise<WordPressMedia> {
    // First, download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const blob = await imageResponse.blob();
    const file = new File([blob], filename || 'image.jpg', { type: blob.type });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('status', 'publish');

    const url = `${this.baseUrl}/media`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload image: ${response.status} - ${errorText}`);
    }

    const media: WordPressMedia = await response.json();

    // If alt text is provided, update the media
    if (alt && media.id) {
      await this.request(`/media/${media.id}`, {
        method: 'POST',
        body: JSON.stringify({ alt_text: alt }),
      });
    }

    return media;
  }

  // Get categories
  async getCategories(): Promise<WordPressCategory[]> {
    return this.request<WordPressCategory[]>('/categories?per_page=100');
  }

  // Get tags
  async getTags(): Promise<WordPressTag[]> {
    return this.request<WordPressTag[]>('/tags?per_page=100');
  }

  // Create category
  async createCategory(name: string): Promise<WordPressCategory> {
    return this.request<WordPressCategory>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // Create tag
  async createTag(name: string): Promise<WordPressTag> {
    return this.request<WordPressTag>('/tags', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }
}

// Factory function to create WordPress client
export function createWordPressClient(config: WordPressConfig): WordPressClient {
  return new WordPressClient(config);
}

// Validate WordPress configuration
export function validateWordPressConfig(config: Partial<WordPressConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.siteUrl) {
    errors.push('WordPress 사이트 URL이 필요합니다');
  } else {
    try {
      new URL(config.siteUrl);
    } catch {
      errors.push('유효하지 않은 URL 형식입니다');
    }
  }

  if (!config.username) {
    errors.push('WordPress 사용자명이 필요합니다');
  }

  if (!config.applicationPassword) {
    errors.push('WordPress Application Password가 필요합니다');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

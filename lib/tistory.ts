// Tistory OAuth 2.0 & API Client
// https://tistory.github.io/document-tistory-apis/

export interface TistoryConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
}

export interface TistoryTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface TistoryBlogInfo {
  blogs: {
    name: string;
    title: string;
    url: string;
    default: boolean;
    secondary: boolean;
    statistics: {
      post: number;
      comment: number;
      trackback: number;
    };
  }[];
}

export interface TistoryPost {
  id: string;
  title: string;
  postUrl: string;
  visibility: number;
  acceptComment: number;
  acceptTrackback: number;
  tags: string[];
  date: string;
}

export interface TistoryPostList {
  blogName: string;
  count: number;
  posts: {
    postId: string;
    title: string;
    postUrl: string;
    visibility: number;
    acceptComment: number;
    acceptTrackback: number;
    tags: string[];
    date: string;
  }[];
  page: number;
  countPerPage: number;
}

export interface TistoryWritePostRequest {
  blogName: string;
  title: string;
  content: string;
  visibility?: number; // 0: 비공개, 1: 보호, 2: 공개, 3: 발행
  category?: number;
  published?: string;
  slogan?: string;
  tag?: string;
  acceptComment?: number; // 0: 비허용, 1: 허용
  acceptTrackback?: number; // 0: 비허용, 1: 허용
  password?: string;
}

export interface TistoryWritePostResponse {
  url: string;
  postId: string;
}

// Tistory API Client
export class TistoryClient {
  private config: TistoryConfig;
  private baseUrl = 'https://www.tistory.com/apis';

  constructor(config: TistoryConfig) {
    this.config = config;
  }

  // Get OAuth authorization URL
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://www.tistory.com/oauth/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async getAccessToken(code: string): Promise<TistoryTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      code,
      grant_type: 'authorization_code',
    });

    const response = await fetch(
      `https://www.tistory.com/oauth/access_token?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.statusText}`);
    }

    const text = await response.text();
    // Tistory returns the token as query string format
    const urlParams = new URLSearchParams(text);

    return {
      access_token: urlParams.get('access_token') || '',
      token_type: urlParams.get('token_type') || 'bearer',
      expires_in: parseInt(urlParams.get('expires_in') || '3600'),
      refresh_token: urlParams.get('refresh_token') || undefined,
    };
  }

  // Helper method to make authenticated API requests
  private async request<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    if (!this.config.accessToken) {
      throw new Error('Access token is required. Please authenticate first.');
    }

    const queryParams = new URLSearchParams({
      access_token: this.config.accessToken,
      output: 'json',
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ),
    });

    const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Tistory API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Tistory API wraps responses in a "tistory" object
    if (data.tistory?.error_code) {
      throw new Error(`Tistory API error: ${data.tistory.message}`);
    }

    return data.tistory as T;
  }

  // Get blog information
  async getBlogInfo(): Promise<TistoryBlogInfo> {
    return this.request<TistoryBlogInfo>('/blog/info');
  }

  // Get post list
  async getPostList(blogName: string, page = 1): Promise<TistoryPostList> {
    return this.request<TistoryPostList>('/post/list', {
      blogName,
      page,
    });
  }

  // Write a new post
  async writePost(request: TistoryWritePostRequest): Promise<TistoryWritePostResponse> {
    return this.request<TistoryWritePostResponse>('/post/write', {
      blogName: request.blogName,
      title: request.title,
      content: request.content,
      visibility: request.visibility ?? 2, // Default: public
      category: request.category ?? 0,
      published: request.published ?? '',
      slogan: request.slogan ?? '',
      tag: request.tag ?? '',
      acceptComment: request.acceptComment ?? 1,
      acceptTrackback: request.acceptTrackback ?? 1,
      password: request.password ?? '',
    });
  }

  // Modify an existing post
  async modifyPost(
    postId: string,
    request: Partial<TistoryWritePostRequest>
  ): Promise<TistoryWritePostResponse> {
    if (!request.blogName) {
      throw new Error('blogName is required');
    }

    return this.request<TistoryWritePostResponse>('/post/modify', {
      blogName: request.blogName,
      postId,
      title: request.title ?? '',
      content: request.content ?? '',
      visibility: request.visibility ?? 2,
      category: request.category ?? 0,
      published: request.published ?? '',
      slogan: request.slogan ?? '',
      tag: request.tag ?? '',
      acceptComment: request.acceptComment ?? 1,
      acceptTrackback: request.acceptTrackback ?? 1,
      password: request.password ?? '',
    });
  }

  // Get categories
  async getCategories(blogName: string): Promise<any> {
    return this.request('/category/list', { blogName });
  }
}

// Factory function
export function createTistoryClient(config: TistoryConfig): TistoryClient {
  return new TistoryClient(config);
}

// Validate Tistory config
export function validateTistoryConfig(config: Partial<TistoryConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.clientId) {
    errors.push('Client ID가 필요합니다');
  }

  if (!config.clientSecret) {
    errors.push('Client Secret이 필요합니다');
  }

  if (!config.redirectUri) {
    errors.push('Redirect URI가 필요합니다');
  } else {
    try {
      new URL(config.redirectUri);
    } catch {
      errors.push('유효하지 않은 Redirect URI 형식입니다');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

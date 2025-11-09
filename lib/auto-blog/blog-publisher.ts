import type { BlogContent } from './content-generator'
import type { GeneratedImage } from './image-generator'
import { createPost } from '@/lib/blog-storage'

export interface PublishResult {
  success: boolean
  slug: string
  url: string
  publishedAt: string
  error?: string
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function publishBlog(
  content: BlogContent,
  images: GeneratedImage[]
): Promise<PublishResult> {
  try {
    const body = content.content
    const post = await createPost(content.title, body)

    return {
      success: true,
      slug: post.slug,
      url: `/blog/${post.slug}`,
      publishedAt: post.createdAt,
    }
  } catch (error: any) {
    return {
      success: false,
      slug: '',
      url: '',
      publishedAt: new Date().toISOString(),
      error: error?.message ?? String(error),
    }
  }
}

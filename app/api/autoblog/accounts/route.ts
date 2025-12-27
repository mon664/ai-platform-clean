import { NextRequest, NextResponse } from 'next/server';
import {
  getBlogAccounts,
  createWordPressAccount,
  createTistoryAccount,
  updateBlogAccount,
  deleteBlogAccount
} from '@/lib/autoblog/accounts-storage';

export async function GET() {
  try {
    const accounts = await getBlogAccounts();
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform } = body;

    if (!platform) {
      return NextResponse.json({ error: '플랫폼을 선택해주세요.' }, { status: 400 });
    }

    let account;

    if (platform === 'wordpress') {
      const { name, siteUrl, username, applicationPassword } = body;
      if (!name || !siteUrl || !username || !applicationPassword) {
        return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
      }
      account = await createWordPressAccount({ name, siteUrl, username, applicationPassword });

    } else if (platform === 'tistory') {
      const { name, blogName, tistoryId, tistoryPassword, tistoryUrl } = body;
      if (!name || !blogName || !tistoryId || !tistoryPassword) {
        return NextResponse.json({ error: '이름, 블로그명, ID, 비밀번호를 모두 입력해주세요.' }, { status: 400 });
      }
      account = await createTistoryAccount({ name, blogName, tistoryId, tistoryPassword, tistoryUrl });

    } else {
      return NextResponse.json({ error: '지원하지 않는 플랫폼입니다.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: error.message || 'Failed to create account' }, { status: error.message?.includes('already exists') ? 409 : 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const account = await updateBlogAccount(id, body);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    console.error('Error updating account:', error);
    return NextResponse.json({ error: error.message || 'Failed to update account' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const success = await deleteBlogAccount(id);
    if (!success) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
}

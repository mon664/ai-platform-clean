import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { requireAuth } from '@/lib/auth';

// This interface represents the data sent from the frontend.
interface UploadRequest {
  storyData: {
    title: string;
    script: string;
    scenes: {
      text: string;
      image: string;
      audio: string;
    }[];
  };
  youtubeAccountId: string; // To demonstrate multi-account support
}

// --- Mock Database Functions for OAuth Tokens ---

/**
 * Simulates fetching OAuth tokens from a secure database.
 * In a real app, this would query a database like PostgreSQL or MongoDB.
 * @param accountId The unique identifier for the user's YouTube account.
 * @returns A promise that resolves to the stored tokens.
 */
async function getTokensFromDB(accountId: string): Promise<any> {
  console.log(`[OAuth Mock] Fetching tokens for account: ${accountId}`);
  // In a real implementation, you would fetch these from your database.
  // These are example tokens and would not work.
  const mockTokens = {
    'account_1': {
      access_token: 'mock_access_token_for_account_1',
      refresh_token: 'mock_refresh_token_for_account_1',
      scope: 'https://www.googleapis.com/auth/youtube.upload',
      token_type: 'Bearer',
      expiry_date: Date.now() - 100000, // Mock as expired to test refresh logic
    },
    'account_2': {
      access_token: 'mock_access_token_for_account_2',
      refresh_token: 'mock_refresh_token_for_account_2',
      scope: 'https://www.googleapis.com/auth/youtube.upload',
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600000, // Mock as valid
    },
  };
  // @ts-ignore
  return mockTokens[accountId] || null;
}

/**
 * Simulates saving refreshed OAuth tokens to a secure database.
 * @param accountId The unique identifier for the user's YouTube account.
 * @param tokens The new tokens to save.
 */
async function saveTokensToDB(accountId: string, tokens: any): Promise<void> {
  console.log(`[OAuth Mock] Saving new tokens for account: ${accountId}`, tokens);
  // In a real implementation, you would UPDATE the tokens for this accountId in your database.
}


/**
 * This API route simulates the process of assembling a video and uploading it to YouTube,
 * now including a simulated OAuth 2.0 flow.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { storyData, youtubeAccountId }: UploadRequest = await req.json();

    if (!storyData || !youtubeAccountId) {
      return NextResponse.json({ error: '필수 데이터가 누락되었습니다.' }, { status: 400 });
    }

    // --- OAuth 2.0 Simulation Start ---

    // 1. Initialize OAuth2 Client
    // These credentials must be obtained from Google Cloud Console.
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI // The URL Google redirects to after user consent
    );

    // 2. Fetch tokens for the selected account from your database
    const tokens = await getTokensFromDB(youtubeAccountId);
    if (!tokens) {
      throw new Error(`YouTube 계정(${youtubeAccountId})에 대한 인증 토큰을 찾을 수 없습니다. 계정을 다시 연결해주세요.`);
    }
    oauth2Client.setCredentials(tokens);

    // 3. Handle Token Refresh (IMPORTANT)
    // Check if the access token is expired or close to expiring.
    // The googleapis library can handle this automatically if you listen to the 'tokens' event.
    oauth2Client.on('tokens', (newTokens) => {
      console.log('[OAuth] Access token was refreshed.');
      // The new tokens may or may not include a new refresh_token.
      // Always save the new access_token and its expiry_date.
      // Persist the new refresh_token only if it's provided.
      const updatedTokens = { ...tokens, ...newTokens };
      saveTokensToDB(youtubeAccountId, updatedTokens);
    });
    
    // To manually trigger a refresh for simulation if token is expired:
    if (tokens.expiry_date < Date.now()) {
        console.log('[OAuth Mock] Token is expired, simulating refresh...');
        // In a real scenario, the next API call would automatically trigger the 'tokens' event.
        // For simulation, we can manually call refreshAccessToken.
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        console.log('[OAuth Mock] Token refreshed and set.');
    }


    // 4. Create an authenticated YouTube service object
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });
    console.log('[OAuth] Successfully created authenticated YouTube API client.');

    // --- OAuth 2.0 Simulation End ---


    // --- Video Processing & Upload Simulation Start ---
    console.log('--- YOUTUBE UPLOAD SIMULATION ---');
    console.log(`Authenticated as: ${youtubeAccountId}`);
    console.log(`Video Title: ${storyData.title}`);
    
    // In a real scenario, you would now use the `youtube` object to upload the video.
    // Example:
    // const videoFilePath = await assembleVideo(storyData); // A complex function to render the video
    // const response = await youtube.videos.insert({
    //   part: 'snippet,status',
    //   requestBody: {
    //     snippet: { title: storyData.title, description: storyData.script },
    //     status: { privacyStatus: 'private' },
    //   },
    //   media: { body: fs.createReadStream(videoFilePath) },
    // });
    // console.log('Video uploaded! Video ID:', response.data.id);

    // --- Simulation End ---

    return NextResponse.json({
      success: true,
      videoId: `mock_video_id_${Date.now()}`,
      message: `[시뮬레이션] '${storyData.title}' 영상의 업로드가 시작되었습니다. (인증 계정: ${youtubeAccountId})`,
    });

  } catch (error: any) {
    console.error('유튜브 업로드 시뮬레이션 오류:', error);
    return NextResponse.json(
      { error: error.message || '알 수 없는 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

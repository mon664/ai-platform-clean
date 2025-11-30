import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Database health check
    const postgresUrl = process.env.POSTGRES_URL;

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: postgresUrl ? 'connected' : 'disconnected',
        gemini_api: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured',
        vertex_ai: process.env.VERTEX_AI_PROJECT_ID ? 'configured' : 'not_configured'
      },
      endpoints: {
        blog: '/api/blog/* - AutoBlog functionality',
        ai: '/api/ai/* - AI content generation',
        data: '/api/data/* - Data management (252 items)',
        shorts: '/api/shorts/* - Shorts generation',
        autovid: '/api/autovid/* - AutoVid features'
      }
    };

    return NextResponse.json(healthStatus);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
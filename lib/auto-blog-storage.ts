import { sql } from '@vercel/postgres';

// Postgres 클라이언트 초기화
const postgresUrl = process.env.POSTGRES_URL;
if (!postgresUrl) {
  console.warn('POSTGRES_URL environment variable is not set');
}

// Auto blog generation history logging
export async function logGeneration(data: any) {
  try {
    const dataString = JSON.stringify(data);
    await sql`
      INSERT INTO auto_blog_history (generation_data)
      VALUES (${dataString})
    `;
  } catch (error) {
    console.error('Failed to log generation:', error);
    throw error;
  }
}

// Error logging for auto blog
export async function logError(error: any) {
  try {
    const errorMessage = String(error);
    const errorDetails = JSON.stringify({
      timestamp: new Date().toISOString(),
      stack: error?.stack
    });

    await sql`
      INSERT INTO auto_blog_errors (error_message, error_details)
      VALUES (${errorMessage}, ${errorDetails})
    `;
  } catch (e) {
    console.error('Failed to log error:', e);
    throw e;
  }
}

// Get generation history
export async function getHistory(limit = 30) {
  try {
    const result = await sql`
      SELECT id, generation_data, created_at
      FROM auto_blog_history
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result.rows.map(row => ({
      id: row.id,
      ...row.generation_data,
      timestamp: row.created_at
    }));
  } catch (error) {
    console.error('Failed to get history:', error);
    throw error;
  }
}

// Get error logs
export async function getErrors(limit = 30) {
  try {
    const result = await sql`
      SELECT id, error_message, error_details, created_at
      FROM auto_blog_errors
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result.rows.map(row => ({
      id: row.id,
      error: row.error_message,
      details: row.error_details,
      timestamp: row.created_at
    }));
  } catch (error) {
    console.error('Failed to get errors:', error);
    throw error;
  }
}

// Add topic to queue
export async function enqueueTopic(topic: any) {
  try {
    const topicString = JSON.stringify(topic);
    await sql`
      INSERT INTO auto_blog_topics_queue (topic_data, status)
      VALUES (${topicString}, 'pending')
    `;
  } catch (error) {
    console.error('Failed to enqueue topic:', error);
    throw error;
  }
}

// Get next topic from queue
export async function dequeueTopic(): Promise<any | null> {
  try {
    const result = await sql`
      UPDATE auto_blog_topics_queue
      SET status = 'processing', processed_at = NOW()
      WHERE id = (
        SELECT id FROM auto_blog_topics_queue
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT 1
      )
      RETURNING id, topic_data, created_at
    `;

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id,
        ...row.topic_data,
        createdAt: row.created_at
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to dequeue topic:', error);
    throw error;
  }
}

// Mark topic as completed
export async function markTopicCompleted(topicId: number) {
  try {
    await sql`
      UPDATE auto_blog_topics_queue
      SET status = 'completed', processed_at = NOW()
      WHERE id = ${topicId}
    `;
  } catch (error) {
    console.error('Failed to mark topic as completed:', error);
    throw error;
  }
}

// Mark topic as failed
export async function markTopicFailed(topicId: number, error: string) {
  try {
    await sql`
      UPDATE auto_blog_topics_queue
      SET status = 'failed', processed_at = NOW()
      WHERE id = ${topicId}
    `;

    // Also log the error
    await logError(error);
  } catch (e) {
    console.error('Failed to mark topic as failed:', e);
    throw e;
  }
}

// Get queue status
export async function getQueueStatus() {
  try {
    const result = await sql`
      SELECT
        status,
        COUNT(*) as count
      FROM auto_blog_topics_queue
      GROUP BY status
    `;

    const status: { [key: string]: number } = {};
    result.rows.forEach(row => {
      status[row.status] = parseInt(row.count);
    });

    return status;
  } catch (error) {
    console.error('Failed to get queue status:', error);
    throw error;
  }
}

// Initialize auto-blog database tables
export async function initializeAutoBlogDatabase() {
  try {
    // Create auto_blog_history table
    await sql`
      CREATE TABLE IF NOT EXISTS auto_blog_history (
        id SERIAL PRIMARY KEY,
        generation_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create auto_blog_errors table
    await sql`
      CREATE TABLE IF NOT EXISTS auto_blog_errors (
        id SERIAL PRIMARY KEY,
        error_message TEXT NOT NULL,
        error_details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create auto_blog_topics_queue table
    await sql`
      CREATE TABLE IF NOT EXISTS auto_blog_topics_queue (
        id SERIAL PRIMARY KEY,
        topic_data JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE
      )
    `;

    // Create autoblog_api_keys table
    await sql`
      CREATE TABLE IF NOT EXISTS autoblog_api_keys (
        id INTEGER PRIMARY KEY DEFAULT 1,
        api_keys JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT single_key CHECK (id = 1)
      )
    `;

    // Create autoblog_accounts table
    await sql`
      CREATE TABLE IF NOT EXISTS autoblog_accounts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        platform VARCHAR(50) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        blog_id VARCHAR(255),
        blog_url TEXT,
        client_id TEXT,
        client_secret TEXT,
        api_key TEXT,
        access_token TEXT,
        refresh_token TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create autoblog_schedules table
    await sql`
      CREATE TABLE IF NOT EXISTS autoblog_schedules (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES autoblog_accounts(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        post_id VARCHAR(255),
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_auto_blog_history_created_at ON auto_blog_history(created_at DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_auto_blog_errors_created_at ON auto_blog_errors(created_at DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_auto_blog_topics_queue_status ON auto_blog_topics_queue(status)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_auto_blog_topics_queue_created_at ON auto_blog_topics_queue(created_at)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_autoblog_accounts_platform ON autoblog_accounts(platform)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_autoblog_accounts_is_active ON autoblog_accounts(is_active)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_autoblog_schedules_account_id ON autoblog_schedules(account_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_autoblog_schedules_scheduled_at ON autoblog_schedules(scheduled_at)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_autoblog_schedules_status ON autoblog_schedules(status)
    `;

    console.log('Auto-blog database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize auto-blog database:', error);
    throw error;
  }
}
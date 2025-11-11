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

    console.log('Auto-blog database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize auto-blog database:', error);
    throw error;
  }
}
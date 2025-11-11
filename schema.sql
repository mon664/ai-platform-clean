-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto blog generation history
CREATE TABLE IF NOT EXISTS auto_blog_history (
  id SERIAL PRIMARY KEY,
  generation_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto blog error logs
CREATE TABLE IF NOT EXISTS auto_blog_errors (
  id SERIAL PRIMARY KEY,
  error_message TEXT NOT NULL,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto blog topics queue
CREATE TABLE IF NOT EXISTS auto_blog_topics_queue (
  id SERIAL PRIMARY KEY,
  topic_data JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_blog_history_created_at ON auto_blog_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_blog_errors_created_at ON auto_blog_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_blog_topics_queue_status ON auto_blog_topics_queue(status);
CREATE INDEX IF NOT EXISTS idx_auto_blog_topics_queue_created_at ON auto_blog_topics_queue(created_at);
-- API keys storage (encrypted)
CREATE TABLE IF NOT EXISTS auto_blog_api_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(100) UNIQUE NOT NULL,
  encrypted_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for API keys
CREATE INDEX IF NOT EXISTS idx_auto_blog_api_keys_name ON auto_blog_api_keys(key_name);

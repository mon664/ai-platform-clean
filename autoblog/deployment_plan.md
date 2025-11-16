
# LinkedIn Integration Deployment Plan

This document outlines the steps required to deploy the LinkedIn integration feature.

## 1. Backend Changes (Railway)

1.  **Receive `api_server.py`:** The user needs to provide the `api_server.py` file.
2.  **Integrate LinkedIn Publisher:**
    *   Add code to read the LinkedIn configuration from `config.toml`.
    *   Add a new endpoint `/api/linkedin/post` to the Flask application.
    *   This endpoint will use the `LinkedinPublisher` to post to LinkedIn.
3.  **Update `requirements.txt`:** Add `toml` and `requests` to the `requirements.txt` file if they are not already present.
4.  **Push to Railway:**
    *   Commit the changes to the git repository.
    *   Push the changes to the `main` branch to trigger a new deployment on Railway.

## 2. Frontend Changes (Vercel)

1.  **Update UI:**
    *   Add a "Share on LinkedIn" button to the AutoBlog UI (`app/auto-blog/page.tsx`).
    *   This button will call a new function to handle the LinkedIn sharing.
2.  **Implement LinkedIn Sharing Function:**
    *   Create a new function in `lib/auto-blog/blog-publisher.ts` that sends a POST request to the `/api/linkedin/post` endpoint on the Railway backend.
3.  **Update Environment Variables:**
    *   Ensure the `RAILWAY_API_URL` environment variable in Vercel is set to the correct URL of the Railway application.
4.  **Deploy to Vercel:**
    *   Commit the changes to the git repository.
    *   Push the changes to the `main` branch to trigger a new deployment on Vercel.

## 3. Post-Deployment

1.  **Testing:**
    *   Create a new blog post and share it on LinkedIn using the new feature.
    *   Verify that the post appears on LinkedIn.
2.  **Monitoring:**
    *   Monitor the Vercel and Railway logs for any errors.

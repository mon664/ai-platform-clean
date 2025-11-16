
import toml
from flask import Flask, request, jsonify
from linkedin import LinkedinPublisher

# Load LinkedIn configuration
config = toml.load("config.toml")
linkedin_config = config.get("linkedin", {})
linkedin_access_token = linkedin_config.get("access_token")
linkedin_client_id = linkedin_config.get("client_id")
linkedin_client_secret = linkedin_config.get("client_secret")

# Initialize LinkedinPublisher
linkedin_publisher = LinkedinPublisher(
    access_token=linkedin_access_token,
    client_id=linkedin_client_id,
    client_secret=linkedin_client_secret,
)

# Initialize Flask app
app = Flask(__name__)

@app.route("/api/linkedin/post", methods=["POST"])
def post_to_linkedin():
    data = request.get_json()
    title = data.get("title")
    content = data.get("content")

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    result = linkedin_publisher.post_to_linkedin(title, content)
    return jsonify(result)

if __name__ == "__main__":
    # Example of how to call the /api/linkedin/post endpoint
    # You would typically call this from your frontend application
    import requests

    api_url = "http://127.0.0.1:5000/api/linkedin/post"
    post_data = {
        "title": "My First Post from AutoBlog",
        "content": "This is a test post from the AutoBlog application.",
    }
    response = requests.post(api_url, json=post_data)
    print(response.json())

    # To run this example:
    # 1. Make sure you have Flask and requests installed: pip install Flask requests toml
    # 2. Run this script: python api_server_linkedin_integration_example.py
    # 3. In a separate terminal, run the main api_server.py (when you have it)
    # Note: This is a simplified example. In a real application, you would integrate this into your existing Flask app.
    app.run(debug=True)

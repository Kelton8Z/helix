from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import os
import logging
from dotenv import load_dotenv
import openai
from supabase import create_client, Client
# import google.generativeai as genai
from google import genai

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)  # Add this line
logging.getLogger('werkzeug').setLevel(logging.DEBUG) 
# Configure CORS to allow all origins, methods, and headers
# CORS(app,
#      resources={r"/*": {"origins": "*"}},
#      allow_headers=["Content-Type", "Authorization"],
#      supports_credentials=True,
#      methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
CORS(app, origins="http://localhost:3000")

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
print(f'Supabase URL: {supabase_url}')
print(f'Supabase key: {supabase_key}')
supabase: Client = create_client(supabase_url, supabase_key)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")
print(f'OpenAI API key: {openai.api_key}')

# Initialize Google Generative AI client
genai_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
print(f'Google API key configured: {"Yes" if os.getenv("GOOGLE_API_KEY") else "No"}')

# Define the response schema for structured output
SEQUENCE_SCHEMA = {
    "type": "object",
    "properties": {
        "steps": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "step": {"type": "string"},
                    "content": {"type": "string"}
                },
                "required": ["step", "content"]
            }
        }
    },
    "required": ["steps"]
}

@app.route('/api/health', methods=['GET'])
@cross_origin()
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"})

@app.route('/api/chat', methods=['POST'])
@cross_origin()
def process_chat():
    """Process chat messages and generate responses"""
    try:
        data = request.json
        user_message = data.get('message', '')
        user_id = data.get('userId', 'anonymous')
        model_provider = data.get('modelProvider', 'openai')  # Default to OpenAI if not specified
        model_name = data.get('modelName', 'gpt-4o' if model_provider == 'openai' else 'gemini-2.0-flash')
        
        # Store the message in Supabase
        try:
            supabase_response = supabase.table('messages').insert({
                'user_id': user_id,
                'content': user_message,
                'type': 'user'
            }).execute()
            print(f"Supabase insert response: {supabase_response}")
        except Exception as supabase_error:
            print(f"Supabase error: {str(supabase_error)}")
            return jsonify({
                "error": f"Supabase error: {str(supabase_error)}",
                "status": "error",
                "source": "supabase"
            }), 500
        
        # Generate AI response using selected model provider
        try:
            ai_message = ""
            if model_provider.lower() == 'openai':
                # Generate AI response using OpenAI
                openai_response = openai.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": "You are Helix, a recruiting outreach assistant. Help the user create effective outreach sequences."},
                        {"role": "user", "content": user_message}
                    ]
                )
                ai_message = openai_response.choices[0].message.content
                print(f"OpenAI response received, length: {len(ai_message)}")
            elif model_provider.lower() == 'gemini':
                app.logger.info("Entering Gemini branch")
                # Generate AI response using Gemini
                gemini_response = genai_client.models.generate_content(model="gemini-2.0-flash", contents=user_message)
                ai_message = gemini_response.text
                print(f"Gemini response received, length: {len(ai_message)}")
            else:
                return jsonify({
                    "error": f"Unsupported model provider: {model_provider}",
                    "status": "error",
                    "source": "model_selection"
                }), 400
        except Exception as ai_error:
            print(f"{model_provider} error: {str(ai_error)}")
            return jsonify({
                "error": f"{model_provider} error: {str(ai_error)}",
                "status": "error",
                "source": model_provider.lower()
            }), 500
        
        # Store AI response in Supabase
        try:
            supabase.table('messages').insert({
                'user_id': user_id,
                'content': ai_message,
                'type': 'assistant'
            }).execute()
        except Exception as supabase_error2:
            print(f"Supabase error (storing AI response): {str(supabase_error2)}")
            # Continue anyway since we already have the AI response
        
        return jsonify({
            "message": ai_message,
            "status": "success"
        })
    except Exception as e:
        print(f"General error: {str(e)}")
        return jsonify({
            "error": str(e),
            "status": "error",
            "source": "general"
        }), 500

@app.route('/api/generate-sequence', methods=['POST'])
@cross_origin()
def generate_sequence():
    """Generate a recruiting outreach sequence based on user inputs"""
    data = request.json
    context = data.get('context', {})
    user_id = data.get('userId', 'anonymous')
    model_provider = data.get('modelProvider', 'openai')  # Default to OpenAI if not specified
    model_name = data.get('modelName', 'gpt-4o' if model_provider == 'openai' else 'gemini-2.0-flash')
    
    try:
        # Generate sequence using selected model provider
        sequence = ""
        if model_provider.lower() == 'openai':
            # Generate sequence using OpenAI
            response = openai.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are Helix, a recruiting outreach assistant. Generate a step-by-step outreach sequence based on the provided context."},
                    {"role": "user", "content": f"Generate a recruiting outreach sequence based on this context: {context}"}
                ]
            )
            sequence = response.choices[0].message.content
        elif model_provider.lower() == 'gemini':
            app.logger.info("Entering Gemini branch")
            # Generate sequence using Gemini with structured output
            gemini_response = genai_client.models.generate_content(
                model="gemini-2.0-flash",
                contents={
                    "role": "assistant",
                    "parts": [{
                        "text": f"Generate a recruiting outreach sequence based on this context: {context}"
                    }]
                },
                config={
                    "temperature": 0.7,
                    "response_mime_type": "application/json",
                    "responseSchema": SEQUENCE_SCHEMA
                }
            )
            app.logger.info(f"Got Gemini response: {gemini_response}")
            # Extract steps directly from the parsed field
            steps = gemini_response.parsed.get('steps', [])
            app.logger.info(f"Generated {len(steps)} steps from Gemini")
        else:
            return jsonify({
                "error": f"Unsupported model provider: {model_provider}",
                "status": "error",
                "source": "model_selection"
            }), 400
        
        # Store the sequence in Supabase
        supabase.table('sequences').insert({
            'user_id': user_id,
            'context': context,
            'steps': steps
        }).execute()
        
        return jsonify({
            "sequence": steps,
            "status": "success"
        })
    except Exception as e:
        print(e)
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/api/update-sequence', methods=['PUT'])
@cross_origin()
def update_sequence():
    """Update an existing sequence with user edits"""
    data = request.json
    sequence_id = data.get('sequenceId')
    updated_steps = data.get('steps', [])
    
    try:
        # Update the sequence in Supabase
        supabase.table('sequences').update({
            'steps': updated_steps
        }).eq('id', sequence_id).execute()
        
        return jsonify({
            "message": "Sequence updated successfully",
            "status": "success"
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/api/test-openai', methods=['GET'])
@cross_origin()
def test_openai():
    """Test OpenAI API connection"""
    try:
        if not openai.api_key:
            return jsonify({
                "status": "error",
                "message": "OpenAI API key is not set"
            }), 400
        
        # Try a simple completion to test the API key
        response = openai.chat.completions.create(
            model="gpt-4o",  # Using a cheaper model for testing
            messages=[
                {"role": "system", "content": "You are a test assistant."},
                {"role": "user", "content": "Say hello"}
            ],
            max_tokens=10
        )
        
        return jsonify({
            "status": "success",
            "message": "OpenAI API key is valid",
            "response": response.choices[0].message.content
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"OpenAI API error: {str(e)}",
            "error_type": type(e).__name__
        }), 500

@app.route('/api/test-gemini', methods=['GET'])
@cross_origin()
def test_gemini():
    """Test Gemini API connection"""
    try:
        google_api_key = os.getenv("GOOGLE_API_KEY")
        if not google_api_key:
            return jsonify({
                "status": "error",
                "message": "Google API key is not set"
            }), 400
        
        # Try a simple completion to test the API key
        try:
            response = genai_client.models.generate_content(
    model="gemini-2.0-flash", contents = "Say hello")
            
            return jsonify({
                "status": "success",
                "message": "Google API key is valid",
                "response": response.text
            })
        except Exception as model_error:
            return jsonify({
                "status": "error",
                "message": f"Gemini model error: {str(model_error)}",
                "error_type": type(model_error).__name__
            }), 500
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Gemini API error: {str(e)}",
            "error_type": type(e).__name__
        }), 500

@app.route('/api/test-supabase', methods=['GET'])
@cross_origin()
def test_supabase():
    """Test Supabase connection"""
    try:
        if not supabase_url or not supabase_key:
            return jsonify({
                "status": "error",
                "message": "Supabase credentials are not set"
            }), 400
        
        # Try to fetch data from a table to test the connection
        try:
            # First try to get the list of tables
            response = supabase.table('messages').select("count").limit(1).execute()
            return jsonify({
                "status": "success",
                "message": "Supabase connection is valid",
                "data": response.data
            })
        except Exception as table_error:
            # If that fails, try a raw query to check connection
            response = supabase.rpc('get_service_status').execute()
            return jsonify({
                "status": "partial",
                "message": f"Supabase connection works but table query failed: {str(table_error)}",
                "data": response.data
            })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Supabase error: {str(e)}",
            "error_type": type(e).__name__
        }), 500

if __name__ == '__main__':
    app.run(debug=True)

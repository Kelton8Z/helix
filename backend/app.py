from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import os
from dotenv import load_dotenv
import openai
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
# Configure CORS to allow all origins, methods, and headers
CORS(app, 
     resources={r"/*": {"origins": "*"}},
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

@app.route('/api/health', methods=['GET'])
@cross_origin()
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"})

@app.route('/api/chat', methods=['POST'])
@cross_origin()
def process_chat():
    """Process chat messages and generate responses"""
    data = request.json
    user_message = data.get('message', '')
    user_id = data.get('userId', 'anonymous')
    
    # Store the message in Supabase
    supabase.table('messages').insert({
        'user_id': user_id,
        'content': user_message,
        'type': 'user'
    }).execute()
    
    # Generate AI response using OpenAI
    try:
        response = openai.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are Helix, a recruiting outreach assistant. Help the user create effective outreach sequences."},
                {"role": "user", "content": user_message}
            ]
        )
        
        ai_message = response.choices[0].message.content
        
        # Store AI response in Supabase
        supabase.table('messages').insert({
            'user_id': user_id,
            'content': ai_message,
            'type': 'assistant'
        }).execute()
        
        return jsonify({
            "message": ai_message,
            "status": "success"
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/api/generate-sequence', methods=['POST'])
@cross_origin()
def generate_sequence():
    """Generate a recruiting outreach sequence based on user inputs"""
    data = request.json
    context = data.get('context', {})
    user_id = data.get('userId', 'anonymous')
    
    try:
        # Generate sequence using OpenAI
        response = openai.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are Helix, a recruiting outreach assistant. Generate a step-by-step outreach sequence based on the provided context."},
                {"role": "user", "content": f"Generate a recruiting outreach sequence based on this context: {context}"}
            ]
        )
        
        sequence = response.choices[0].message.content
        
        # Parse the sequence into steps (assuming the AI returns a formatted sequence)
        # In a real implementation, you'd want more robust parsing
        steps = []
        for line in sequence.split('\n'):
            if line.strip().startswith('Step'):
                parts = line.split(':', 1)
                if len(parts) > 1:
                    step_num = parts[0].replace('Step', '').strip()
                    step_content = parts[1].strip()
                    steps.append({"step": step_num, "content": step_content})
        
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

if __name__ == '__main__':
    app.run(debug=True)

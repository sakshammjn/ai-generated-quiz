from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
import firebase_admin
from firebase_admin import credentials, auth
from flask import Flask, request, jsonify, session
from openai import OpenAI
import json
import re
import requests
from pymongo import MongoClient
from youtube_transcript_api import YouTubeTranscriptApi
import uuid
from collections import defaultdict
import numpy as np
from flask_socketio import SocketIO
import threading
import cv2
import dlib
import time
app = Flask(__name__)
global_uid = None
socketio = SocketIO(app, cors_allowed_origins="*") 




# Enable CORS
CORS(app)

# MongoDB Configuration
app.config["MONGO_URI"] = "mongodb://localhost:27017/usersDB"
mongo = PyMongo(app)

# Firebase Admin Initialization
cred = credentials.Certificate("firebase.json")  # Download from Firebase
firebase_admin.initialize_app(cred)

# OpenAI API Configuration
API_KEY = "ddc-3jsYi0OJLtcuTXEYL2ue2k4Q5o2kjmwkv1YlowcGfmDNuO2cxc"  # ⚠️ Replace with a real API key
BASE_URL = "https://api.sree.shop/v1"

client = OpenAI(
    api_key=API_KEY,
    base_url=BASE_URL
)
#questions
def generate_questions(concept, difficulty, subject):
    prompt = f"generate 5 of multiple-choice questions on '{concept}' ({subject}) for a {difficulty} level quiz in JSON name-value pair format. in question , options(A,B,C & D) and correct_answer format"
    try:
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )

        raw_response = completion.choices[0].message.content  
        match = re.search(r"\[\s*{.*?}\s*\]", raw_response, re.DOTALL)  # Extract JSON part
        if match:
            questions_json = match.group(0)
            return json.loads(questions_json)
        else:
            return []
    except Exception as e:
        print("Error generating quiz:", e)
        return []
    
LOOK_AWAY_TIME_THRESHOLD = 3  # seconds
TRAINING_TIME = 10  # seconds
calib_values = {}
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("C:/Users/HP/OneDrive/Desktop/odoo/code/shape_predictor_68_face_landmarks.dat")

def train_model():
    """ Trains the gaze detection by calculating reference points. """
    global calib_values
    training_data = {"eye_x": [], "eye_y": [], "nose_x": [], "chin_y": []}
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return
    
    print("\nTraining Phase: Look straight at the camera...")
    start_time = time.time()
    
    while time.time() - start_time < TRAINING_TIME:
        ret, frame = cap.read()
        if not ret:
            continue
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = detector(gray)
        
        if len(faces) > 0:
            landmarks = predictor(gray, faces[0])
            training_data["eye_x"].append((landmarks.part(36).x + landmarks.part(45).x) // 2)
            training_data["eye_y"].append((landmarks.part(37).y + landmarks.part(40).y) // 2)
            training_data["nose_x"].append(landmarks.part(30).x)
            training_data["chin_y"].append(landmarks.part(8).y)
    
    calib_values = {
        "eye_x": int(np.mean(training_data["eye_x"])),
        "eye_y": int(np.mean(training_data["eye_y"])),
        "nose_x": int(np.mean(training_data["nose_x"])),
        "chin_y": int(np.mean(training_data["chin_y"]))
    }

    print("\nTraining Completed! Now detecting gaze movement...")
    cap.release()
    
    # Start gaze detection in a separate thread
    threading.Thread(target=monitor_gaze, daemon=True).start()

  # <-- Track this globally

def monitor_gaze():
    """ Continuously checks if the user is looking away and emits WebSocket events. """
    look_away_count = 0
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam for gaze detection.")
        return
    
    last_look_away_time = None

    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = detector(gray)
        
        if len(faces) > 0:
            landmarks = predictor(gray, faces[0])
            eye_x = (landmarks.part(36).x + landmarks.part(45).x) // 2
            eye_y = (landmarks.part(37).y + landmarks.part(40).y) // 2
            nose_x = landmarks.part(30).x
            chin_y = landmarks.part(8).y

            # Check if user is looking away
            if (
                abs(eye_x - calib_values["eye_x"]) > 20 or
                abs(eye_y - calib_values["eye_y"]) > 20 or
                abs(nose_x - calib_values["nose_x"]) > 20 or
                abs(chin_y - calib_values["chin_y"]) > 20
            ):
                if last_look_away_time is None:
                    last_look_away_time = time.time()
                elif time.time() - last_look_away_time > LOOK_AWAY_TIME_THRESHOLD:
                    look_away_count += 1
                    print(f"⚠️ Looking Away Detected! Count: {look_away_count}")
                    socketio.emit("look_away", {"message": f"User is looking away! ({look_away_count}/3)"})
                    last_look_away_time = None

                    if look_away_count >= 3:
                        print("🚨 Auto-submit triggered!")
                        socketio.emit("auto_submit", {"message": "Auto-submitting due to gaze violations"})
                        break
            else:
                last_look_away_time = None
                socketio.emit("look_away", {"message": "User is looking at the screen."})

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()


@app.route('/train', methods=['POST'])
def train():
    try:
        print("Training started...")
        threading.Thread(target=train_model, daemon=True).start()
        return jsonify({"status": "success", "message": "Training started!"})
    except Exception as e:
        print("Error in training:", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

def setup_global_uid(u):
    global global_uid
    if global_uid is None:
        global_uid = u
        print("Generated UID once:", global_uid)

def search_youtube_videos(topic):
    print("\n\n\n")
    print("topics")
    print(topic)
    
    """Search YouTube for educational videos in English (excluding Shorts)."""
    search_url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": f"{topic} tutorial",
        "key": YOUTUBE_API_KEY,
        "type": "video",
        "maxResults": 3,
        "videoDuration": "medium",  # Exclude Shorts (use "long" for only long videos)
        "relevanceLanguage": "en",  # Prioritize English content
        "videoEmbeddable": "true"  # Ensure videos are embeddable
    }
    
    response = requests.get(search_url, params=params)
    videos = []
    
    if response.status_code == 200:
        data = response.json()
        for item in data.get("items", []):
            video_id = item["id"]["videoId"]
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            videos.append(video_url)

    print("\n\n\n")
    print("vids")
    print(videos)
    return videos


@app.route("/api/auth/signup", methods=["POST"])
def signup():
    try:
        data = request.json
        email = data.get("email")
        uid = data.get("uid")
        setup_global_uid(uid)
        
        print(global_uid)  
        
        first_name = data.get("firstName")
        last_name = data.get("lastName")
        display_name = data.get("displayName")
        




        token = data.get("token")
        if token:
            decoded_token = auth.verify_id_token(token)
          
            if decoded_token["uid"] != uid:
                return jsonify({"error": "Invalid authentication"}), 401
        
        
        existing_user = mongo.db.users.find_one({"email": email})
        if not existing_user:
            user_data = {
                "uid": uid,
                "email": email,
                "firstName": first_name,
                "lastName": last_name,
                "displayName": display_name
            }
            mongo.db.users.insert_one(user_data)
            
        return jsonify({
            "message": "User registered successfully!",
            "uid": uid,
            "email": email,
            "name": display_name
        }), 200

    except Exception as e:
        print(f"Error in signup route: {str(e)}")
        return jsonify({"error": str(e)}), 400






YOUTUBE_API_KEY = "AIzaSyBEJzG9H6QVjqJg6t7wsDUMiY1-AwnoVYk"
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

#initial quiz
@app.route("/generate_quiz", methods=["POST"])
def generate_quiz():
    print("helpp")
    print(session.get('u'))
    data = request.get_json()
    concept = data.get("concept")
    difficulty = data.get("difficulty")
    subject = data.get("subject")



    questions = generate_questions(concept, difficulty, subject)
    print(questions)

    if not questions:
        return jsonify({"error": "Failed to generate questions"}), 500

    return jsonify({"questions": questions})

#result
@app.route('/result', methods=['POST'])
def evaluate_quiz():
    print(global_uid)
    data = request.json
    if not data or "answers" not in data or "questions" not in data:
        return jsonify({"error": "Invalid request. Missing answers or questions."}), 400

    answers = data["answers"]
    
    questions = data["questions"]

    incorrect_questions = []
    
    
    

    for q in questions:
        correct_answer = q["correct_answer"]  # e.g., "B) Newton"
        

        user_answer = answers.get(q["question"], "")
       
        print("User Answer:", user_answer)

    # Compare user answer with correct answer (extract only letter from correct answer)
        correct_option = correct_answer.split(")")[0]
        print("Correct Answer:", correct_option)
        
        


        if user_answer != correct_option:
            incorrect_questions.append({
                "question": q["question"],
                "correctAnswer": correct_answer,
                "userAnswer": user_answer
            })

    result_data = {
        "score": len(questions) - len(incorrect_questions),
        "total": len(questions),
        "incorrectQuestions": incorrect_questions
        
        
    }

    # If no incorrect questions, return success without weak topics
    if not incorrect_questions:
        return jsonify(result_data)

    # Analyze weak topics if mistakes exist
    weak_topics = analyze_weak_topics(incorrect_questions)
    
    result_data["Links"] = weak_topics
    s=len(questions) - len(incorrect_questions)
    sub_for_db(questions, s)
    

    return jsonify(result_data)

#weakness
def analyze_weak_topics(incorrect_questions):
    # Generate search terms based on incorrect questions
    search_terms = []
    for q in incorrect_questions:
        search_terms.append(q["question"])  # Use the question text as the search term

    # Collect YouTube links for each search term
    youtube_links = []
    for term in search_terms:
        links = search_youtube_videos(term)
        for link in links:
            if len(youtube_links) < 3:
                youtube_links.append(link)
            else:
                break
        if len(youtube_links) >= 3:
            break


    return youtube_links  # Return the list of YouTube links



#authentication

@app.route("/api/auth/google", methods=["POST"])
def google_auth():
    try:
        data = request.json
        token = data.get("token")

        # Verify Firebase token
        decoded_token = auth.verify_id_token(token)
        
      
        uid = decoded_token["uid"]
        setup_global_uid(uid)
        
        print(global_uid)   
        
        email = decoded_token["email"]
        name = decoded_token.get("name", "No Name")

        # Store user in MongoDB (if not exists)
        user = mongo.db.users.find_one({"email": email})
        if not user:
            mongo.db.users.insert_one({"uid": uid, "email": email, "name": name})

        return jsonify({"message": "User authenticated successfully!", "uid": uid, "email": email, "name": name}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 401
    



  
@app.route("/api/user/concepts", methods=["GET"])
def get_user_concepts():
    try:
        uid = global_uid  
        print("UID:", uid)

        if not uid:
            return jsonify({"error": "User not authenticated"}), 401

        # Access correct DB and collection
        db = mongo.cx["your_db_name"]
        user_scores_collection = db.user_scores

        # Fetch all user records
        user_concepts = user_scores_collection.find({"user_id": uid})

        # Group by subject and process data
        grouped = defaultdict(lambda: {
            "concepts": [],
            "total_concepts": 0,
            "total_score": 0
        })

        for doc in user_concepts:
            subject = doc.get("subject", "unknown")
            concept = doc.get("concept", "unknown")
            score = doc.get("score", 0)

            grouped[subject]["concepts"].append({
                "concept": concept,
                "score": score
            })
            grouped[subject]["total_concepts"] += 1
            grouped[subject]["total_score"] += score

        # Final formatted result
        result = []
        for subject, data in grouped.items():
            result.append({
                "subject": subject,
                "total_concepts": data["total_concepts"],
                "total_score": data["total_score"],
                "concepts": data["concepts"]
            })

        print("Grouped Result:", result)
        return jsonify(result), 200

    except Exception as e:
        print("Error fetching user concepts:", e)
        return jsonify({"error": str(e)}), 500

   
    





def ts(video_id):
    #"""Fetches and returns the transcript of a YouTube video."""
    if not video_id:
        return {"error": "Invalid YouTube URL"}

    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        text_only = " ".join([entry["text"] for entry in transcript])
        return {"transcript": text_only}

    except Exception as e:
        return {"error": str(e)}

# ✅ API Route to generate quiz from a YouTube video
@app.route('/yt_quiz', methods=["POST"])
def ts_que():
    # """Takes YouTube video ID, extracts transcript, and generates MCQ questions."""
    data = request.json
    video_id = data.get("video_id")

    if not video_id:
        return jsonify({"error": "Missing video_id"}), 400

    transcript_data = ts(video_id)

    if "error" in transcript_data:
        return jsonify({"error": transcript_data["error"]}), 400

    transcript_text = transcript_data["transcript"]

    # ✅ GPT-4o prompt to generate MCQs
    prompt = f"Analyze the following YouTube video transcript and generate 5 MCQ questions from it. Output should be JSON with 'question', 'options' (A, B, C, D), and 'correct_answer'. Transcript:\n\n{transcript_text}"

    try:
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        raw_response = completion.choices[0].message.content  

        # ✅ Extract JSON part using regex
        match = re.search(r"\[\s*{.*?}\s*\]", raw_response, re.DOTALL)
        if match:
            questions_json = match.group(0)
            return jsonify({"questions": json.loads(questions_json)})
        else:
            return jsonify({"error": "Invalid JSON response from AI"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    




def extract_video_id(youtube_url):
    """Extracts the video ID from a YouTube URL."""
    match = re.search(r"v=([a-zA-Z0-9_-]{11})", youtube_url)
    if match:
        return match.group(1)
    return None

##@app.route("/get_transcript", methods=["POST"])
def get_transcript():
    try:
        data = request.json
        youtube_url = data.get("url")

        if not youtube_url:
            return jsonify({"error": "No URL provided"}), 400

        video_id = extract_video_id(youtube_url)
        if not video_id:
            return jsonify({"error": "Invalid YouTube URL"}), 400

        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        text_only = " ".join([entry["text"] for entry in transcript])

        return jsonify({"transcript": text_only})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

client_mongo = MongoClient("mongodb://localhost:27017/")
db = client_mongo["your_db_name"]
user_scores_collection = db["user_scores"]

# Add in dashboard
def sub_for_db(que, score):
    prompt = f"Analyze the following questions in json format '{que}' and identify the subject and concept topic of the questions and return the one to two word subject and concept in small letter separated by comma and not in json format"

    try:
        # Call OpenAI
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )

        raw_response = completion.choices[0].message.content.strip()
        print("GPT Response:", raw_response)

        # Parse the response
        if "," in raw_response:
            subject, concept = [x.strip() for x in raw_response.split(",", 1)]
        else:
            subject, concept = "unknown", "unknown"

        # Get user ID 
        uid =  global_uid
        print("in",global_uid)

        if not uid:
            print("User ID not found in headers!")
            return

        # Save to MongoDB
        user_scores_collection.insert_one({
            "user_id": uid,
            "subject": subject,
            "concept": concept,
            "score": score
        })

        print(f"Saved to DB: {uid} | {subject} | {concept} | {score}")

    except Exception as e:
        print("Error storing subject/concept in DB:", e)









if __name__ == "__main__":
    app.run(debug=True, port=8080)

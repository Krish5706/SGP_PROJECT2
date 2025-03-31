import speech_recognition as sr
from googletrans import Translator
from gtts import gTTS
import os
from flask import Flask, request, jsonify
import threading

app = Flask(__name__)

# Initialize the translator
translator = Translator()

def transcribe_audio(audio_file):
    """Convert speech to text"""
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_file) as source:
        audio_data = recognizer.record(source)
        try:
            text = recognizer.recognize_google(audio_data)
            return text
        except Exception as e:
            return str(e)

def translate_text(text, target_language):
    """Translate text to target language"""
    try:
        translation = translator.translate(text, dest=target_language)
        return translation.text
    except Exception as e:
        return str(e)

def text_to_speech(text, language, output_file):
    """Convert text to speech"""
    try:
        tts = gTTS(text=text, lang=language, slow=False)
        tts.save(output_file)
        return True
    except Exception as e:
        return str(e)

@app.route('/translate_speech', methods=['POST'])
def translate_speech():
    """API endpoint to translate speech"""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    target_language = request.form.get('target_language', 'en')
    
    # Save the temporary audio file
    temp_audio = "temp_audio.wav"
    file.save(temp_audio)
    
    # Process in the background
    def process():
        text = transcribe_audio(temp_audio)
        translated_text = translate_text(text, target_language)
        result = {
            "original_text": text,
            "translated_text": translated_text
        }
        
        # Optional: generate speech
        if request.form.get('generate_speech', 'false').lower() == 'true':
            output_file = f"translated_{target_language}.mp3"
            text_to_speech(translated_text, target_language, output_file)
            result["audio_file"] = output_file
            
        # Clean up
        os.remove(temp_audio)
        
        return jsonify(result)
    
    # Start processing in background
    thread = threading.Thread(target=process)
    thread.start()
    
    return jsonify({"status": "processing"}), 202

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
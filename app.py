import os
import cv2
import numpy as np
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    return jsonify({"success": True, "message": "Բարի գալուստ Roomify Ai"})

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files: return jsonify({"error": "No file"}), 400
    file = request.files['file']
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    # AI Scanning logic using OpenCV
    img = cv2.imread(filepath)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=50, maxLineGap=10)
    
    processed_lines = []
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            processed_lines.append({"x1": int(x1), "y1": int(y1), "x2": int(x2), "y2": int(y2)})

    return jsonify({"success": True, "lines": processed_lines[:40], "image_size": {"width": img.shape[1], "height": img.shape[0]}})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

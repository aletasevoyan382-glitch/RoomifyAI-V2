import os
import cv2
import numpy as np
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    # Strict Validation
    if len(name) < 3:
        return jsonify({"success": False, "message": "Անունը պետք է լինի առնվազն 3 տառ:"}), 400
    if '@' not in email or '.' not in email:
        return jsonify({"success": False, "message": "Խնդրում ենք ներմուծել վավեր էլ. հասցե:"}), 400
    if len(password) < 6:
        return jsonify({"success": False, "message": "Գաղտնաբառը պետք է լինի առնվազն 6 նիշ:"}), 400

    return jsonify({"success": True, "message": "Գրանցումը հաջողվեց:"})

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "Ֆայլ չի գտնվել:"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Ֆայլն ընտրված չէ:"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # AI Processing (OpenCV)
        try:
            image = cv2.imread(filepath)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=10)
            
            processed_lines = []
            if lines is not None:
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    processed_lines.append({"x1": int(x1), "y1": int(y1), "x2": int(x2), "y2": int(y2)})

            return jsonify({
                "success": True,
                "lines": processed_lines[:50], # Limit to 50 for performance
                "image_size": {"width": image.shape[1], "height": image.shape[0]}
            })
        except Exception as e:
            return jsonify({"error": f"Մշակման սխալ: {str(e)}"}), 500

    return jsonify({"error": "Անթույլատրելի ֆայլի տեսակ:"}), 400

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)

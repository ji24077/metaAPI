#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import base64
import cv2
import numpy as np
import os
import time
import subprocess
import uuid
from pathlib import Path
import logging

app = Flask(__name__)
CORS(app)  # Enable access from Vue.js

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
PYTHON_PATH = '/opt/anaconda3/envs/animated_drawings_38/bin/python'
SCRIPT_PATH = 'examples/image_to_animation.py'

# Create folders
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Static file serving path
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

@app.route('/api/animate', methods=['POST'])
def create_animation():
    """
    Receive image drawn in Vue.js and convert to animation
    """
    try:
        # Parse request data
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'error': 'Image data is required'}), 400
        
        image_data = data['image']
        motion = data.get('motion', 'dab')  # Default motion: dab
        output_format = data.get('output_format', 'gif')  # Default format: gif
        
        logger.info(f"Animation creation request - Motion: {motion}, Format: {output_format}")
        
        # 1. Save Base64 image to file
        unique_id = str(uuid.uuid4())
        input_filename = f"{unique_id}_input.png"
        input_path = os.path.join(UPLOAD_FOLDER, input_filename)
        output_dir = os.path.join(OUTPUT_FOLDER, unique_id)
        
        # Base64 decode and save image
        if image_data.startswith('data:image'):
            # Remove data:image/png;base64, part
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({'error': 'Image decoding failed'}), 400
        
        # Save image
        cv2.imwrite(input_path, img)
        logger.info(f"Input image saved: {input_path}")
        
        # 2. Set motion configuration file path
        motion_configs = {
            'dab': 'examples/config/motion/dab.yaml',
            'jumping': 'examples/config/motion/jumping.yaml',
            'jumping_jacks': 'examples/config/motion/jumping_jacks.yaml',
            'wave_hello': 'examples/config/motion/wave_hello.yaml',
            'zombie': 'examples/config/motion/zombie.yaml'
        }
        
        motion_cfg_path = motion_configs.get(motion, motion_configs['dab'])
        retarget_cfg_path = 'examples/config/retarget/fair1_ppf.yaml'
        
        # 3. Execute AnimatedDrawings script
        start_time = time.time()
        
        # Set PYTHONPATH
        env = os.environ.copy()
        env['PYTHONPATH'] = '/Users/jisunghan/metaDrawingtest/AnimatedDrawings:' + env.get('PYTHONPATH', '')
        
        cmd = [
            PYTHON_PATH,
            SCRIPT_PATH,
            input_path,
            output_dir,
            motion_cfg_path,
            retarget_cfg_path
        ]
        
        logger.info(f"Execute command: {' '.join(cmd)}")
        
        # Execute subprocess
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            env=env  # Include PYTHONPATH environment variable
        )
        
        processing_time = round(time.time() - start_time, 1)
        
        if result.returncode != 0:
            logger.error(f"Animation creation failed: {result.stderr}")
            return jsonify({
                'error': 'Animation creation failed',
                'details': result.stderr
            }), 500
        
        # 4. Check result file
        output_video_path = os.path.join(output_dir, 'video.gif')
        
        if not os.path.exists(output_video_path):
            return jsonify({'error': 'Animation file creation failed'}), 500
        
        # 5. Collect animation information
        try:
            import imageio
            gif = imageio.mimread(output_video_path, memtest=False)
            frame_count = len(gif)
        except Exception as e:
            logger.warning(f"Frame count calculation failed: {e}")
            frame_count = 339  # Use default value
        
        # 6. Return result
        video_url = f"http://localhost:5000/api/download/{unique_id}/video.gif"
        
        result_data = {
            'status': 'success',
            'video_url': video_url,
            'processing_time': processing_time,
            'frame_count': frame_count,
            'motion': motion,
            'unique_id': unique_id
        }
        
        logger.info(f"Animation creation complete: {processing_time}s, {frame_count} frames")
        
        # 7. Clean up temporary input file
        try:
            os.remove(input_path)
        except:
            pass
        
        return jsonify(result_data)
        
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Processing timeout (5 minutes)'}), 408
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/download/<unique_id>/<filename>')
def download_file(unique_id, filename):
    """
    Download generated animation file
    """
    try:
        file_path = os.path.join(OUTPUT_FOLDER, unique_id, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(file_path, as_attachment=False)
        
    except Exception as e:
        logger.error(f"File download error: {str(e)}")
        return jsonify({'error': 'File download failed'}), 500

@app.route('/api/motions')
def get_available_motions():
    """
    Return available motion list
    """
    motions = [
        {'id': 'dab', 'name': 'Dab Dance', 'description': 'Arm bent dab pose'},
        {'id': 'jumping', 'name': 'Jump', 'description': 'Jump in place'},
        {'id': 'jumping_jacks', 'name': 'Jumping Jacks', 'description': 'Jump with arms and legs spread'},
        {'id': 'wave_hello', 'name': 'Wave Hello', 'description': 'Wave hand greeting'},
        {'id': 'zombie', 'name': 'Zombie Walk', 'description': 'Walk like a zombie'}
    ]
    
    return jsonify({'motions': motions})

@app.route('/api/health')
def health_check():
    """
    Server health check
    """
    try:
        # Check EC2 TorchServe connection
        import requests
        response = requests.get('http://15.157.188.112:8080/ping', timeout=5)
        torchserve_status = response.status_code == 200
    except:
        torchserve_status = False
    
    return jsonify({
        'status': 'healthy',
        'torchserve_connected': torchserve_status,
        'python_path': PYTHON_PATH,
        'timestamp': time.time()
    })

@app.route('/api/cleanup', methods=['POST'])
def cleanup_old_files():
    """
    Clean up old files (optional)
    """
    try:
        current_time = time.time()
        cleanup_count = 0
        
        # Delete files older than 1 hour
        for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
            for item in os.listdir(folder):
                item_path = os.path.join(folder, item)
                if os.path.isfile(item_path):
                    if current_time - os.path.getctime(item_path) > 3600:  # 1 hour
                        os.remove(item_path)
                        cleanup_count += 1
                elif os.path.isdir(item_path):
                    # Check folder too
                    if current_time - os.path.getctime(item_path) > 3600:
                        import shutil
                        shutil.rmtree(item_path)
                        cleanup_count += 1
        
        return jsonify({
            'status': 'success',
            'cleaned_files': cleanup_count
        })
        
    except Exception as e:
        return jsonify({'error': f'Cleanup failed: {str(e)}'}), 500

if __name__ == '__main__':
    logger.info("🚀 AnimatedDrawings API server starting")
    logger.info(f"Python path: {PYTHON_PATH}")
    logger.info(f"Script path: {SCRIPT_PATH}")
    logger.info(f"Upload folder: {UPLOAD_FOLDER}")
    logger.info(f"Output folder: {OUTPUT_FOLDER}")
    
    # Run in development mode
    app.run(debug=True, host='0.0.0.0', port=5000) 
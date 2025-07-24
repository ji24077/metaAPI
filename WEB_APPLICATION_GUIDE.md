# 🎨 AnimatedDrawings Web Application Guide

## 📋 Project Overview
This project is a web-based system that allows users to draw stick figures in a browser and have AI convert them into 3D animations.

### 🏗️ Architecture
```
Frontend (Vue.js) → Flask API → TorchServe ML Server → AnimatedDrawings → GIF/MP4
```

- **Frontend**: HTML5 Canvas for drawing
- **Backend**: Flask API (image processing + animation generation)
- **AI Processing**: TorchServe on server (character detection + pose estimation)
- **Animation**: Meta's AnimatedDrawings library

## 🚀 Quick Start Guide

### 1. Environment Setup
```bash
# Create Python 3.8 environment (Important: Version 3.8 required)
conda create -n animated_drawings python=3.8
conda activate animated_drawings

# Install packages
pip install -r requirements.txt

# Set PYTHONPATH (modify to your project root path)
export PYTHONPATH=/your/project/path/AnimatedDrawings:$PYTHONPATH
```

### 2. Server Execution
```bash
# Terminal 1: Flask API server
python animation_api.py

# Terminal 2: Web server
python -m http.server 8080
```

### 3. Access
```
http://localhost:8080
```

## 📁 Core File Structure

### Frontend Files
- `index.html` - Complete web application (includes Vue.js)
- `StickmanAnimator.vue` - Vue component (reference only)
- `package.json` - Frontend dependencies

### Backend Files
- `animation_api.py` - Flask API server (main backend)
- `requirements.txt` - Python dependencies
- `examples/image_to_annotations.py` - TorchServe connection (modified)

### Data Folders
- `uploads/` - Stores uploaded images
- `outputs/` - Stores generated animations
- `examples/config/` - Motion configuration files

## 🔧 Integration Considerations

### 1. Path Configuration Updates
In `animation_api.py` file:
```python
# Before
PYTHON_PATH = '/opt/anaconda3/envs/animated_drawings_38/bin/python'
env['PYTHONPATH'] = '/Users/jisunghan/metaDrawingtest/AnimatedDrawings:' + env.get('PYTHONPATH', '')

# After (dynamic paths)
import sys
PYTHON_PATH = sys.executable
env['PYTHONPATH'] = os.path.dirname(os.path.abspath(__file__)) + ':' + env.get('PYTHONPATH', '')
```

### 2. TorchServe Server Configuration
Currently hardcoded to `15.157.188.112:8080`.
When using a new server, modify in `examples/image_to_annotations.py`:
```python
# Change IP address on lines 50, 94
resp = requests.post("http://YOUR_NEW_IP:8080/predictions/drawn_humanoid_detector", ...)
```

## 🎯 API Specification

### POST `/api/animate`
Convert stick figure image to animation

**Request:**
```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "motion": "dab",
  "output_format": "gif"
}
```

**Response:**
```json
{
  "success": true,
  "video_url": "http://localhost:5000/outputs/abc123/video.gif",
  "processing_time": 34.5,
  "frame_count": 339
}
```

### GET `/api/health`
Check system status

**Response:**
```json
{
  "status": "healthy",
  "torchserve_status": "connected",
  "python_env": "animated_drawings"
}
```

## 🎨 Frontend Features

### Drawing Canvas
- HTML5 Canvas usage
- Mouse/touch support
- Brush size adjustment
- Color selection (black recommended)
- Clear/reset functionality

### Animation Controls
- Upload progress bar
- Processing progress bar
- Play/pause/restart
- Download functionality

### Motion Selection
Available motions:
- `dab` - Dab motion
- `jumping` - Jump motion
- `wave_hello` - Wave greeting
- `zombie` - Zombie walk
- `jesse_dance` - Dance motion

## 🔐 Security Considerations

### File Upload Restrictions
- Image files only
- File size limit (10MB)
- Automatic temporary file cleanup

### CORS Configuration
```python
from flask_cors import CORS
CORS(app)  # Allow all domains (development)
```

For production, allow specific domains only:
```python
CORS(app, origins=['https://yourdomain.com'])
```

## 🐛 Troubleshooting

### Common Issues
- **Port conflicts**: Change ports in respective config files
- **TorchServe connection errors**: Check server status and model files
- **Python path errors**: Ensure PYTHONPATH includes project root
- **Memory issues**: Increase available memory allocation

### Log Files
- Flask API logs: `logs/log.txt`
- TorchServe logs: `torchserve/logs/`
- Browser console: F12 Developer Tools

## 🚀 Deployment

### Development
```bash
# All services on localhost
python animation_api.py  # Port 5000
python -m http.server 3000  # Port 3000
```

### Production Considerations
- Use production WSGI server (gunicorn, uwsgi)
- Configure reverse proxy (nginx, apache)
- Set up SSL certificates
- Configure proper CORS origins
- Set up monitoring and logging
- Use environment variables for configuration

## 📊 Performance Optimization

### Backend
- Use Redis for caching
- Implement request queuing
- Optimize model loading
- Use GPU acceleration if available

### Frontend
- Implement image compression
- Add loading states
- Use progressive enhancement
- Optimize bundle size

This web application provides a complete solution for creating animated drawings with modern web technologies and AI-powered processing. 

# 🎨 AnimatedDrawings Web Application

A web-based application that allows users to draw stick figures in their browser and have AI convert them into animated GIFs. Built with Vue.js frontend, Flask API backend, and powered by Meta's AnimatedDrawings AI models.

## ✨ Features

- 🎨 **Interactive Drawing Canvas** - Draw stick figures directly in your browser
- 📁 **File Upload Support** - Upload existing drawings (PNG, JPG, GIF)
- 🤖 **AI-Powered Animation** - Automatic character detection and pose estimation
- 🎬 **Multiple Motion Types** - Choose from 5 different animations (dab, jumping, wave, zombie, dance)
- 💾 **Export Options** - Download animations as GIF files
- 📱 **Responsive Design** - Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ with conda
- Modern web browser
- No local TorchServe installation needed (uses external AI server)

### 1. Clone Repository
```bash
git clone https://github.com/ji24077/metaAPI.git
cd metaAPI
```

### 2. Setup Virtual Environment
```bash
# Create and activate virtual environment
conda create --name animated_drawings python=3.8
conda activate animated_drawings

# Install dependencies
pip install -e .
pip install flask-cors==4.0.0 imageio==2.31.3
```

### 3. Run Backend API Server (Terminal 1)
```bash
# Activate virtual environment
conda activate animated_drawings

# Set Python path (modify to your project path)
export PYTHONPATH="/path/to/your/metaAPI:$PYTHONPATH"

# Start Flask API server
python animation_api.py
```

### 4. Run Frontend Server (Terminal 2)
```bash
# No virtual environment needed for frontend
python -m http.server 3000
```

### 5. Access Web Application
Open your browser and navigate to:
```
http://localhost:3000
```

## 🎯 How to Use

1. **Choose Mode**: Select "Draw" to create new drawings or "Upload" to use existing images
2. **Create Content**: 
   - **Draw Mode**: Use the canvas to draw a stick figure
   - **Upload Mode**: Drag & drop or click to upload an image file
3. **Generate Animation**: Click "✨ Create Animation" button
4. **Wait for Processing**: AI analyzes your drawing and generates animation (~30-60 seconds)
5. **Download Result**: Save the animated GIF to your computer

## 🏗️ Architecture

```
Browser (Vue.js) → Flask API (Port 5000) → External TorchServe (AI Models) → AnimatedDrawings Library
```

- **Frontend**: HTML5 Canvas + Vue.js for interactive drawing
- **Backend**: Flask API for image processing and animation generation
- **AI Processing**: External TorchServe server for character detection and pose estimation
- **Animation Engine**: Meta's AnimatedDrawings library for motion synthesis

### Meta AnimatedDrawings API Environment

This application leverages **Meta's AnimatedDrawings AI models** running on an external TorchServe instance:

- **Character Detection Model**: `drawn_humanoid_detector.mar` - Detects and crops human-like figures from drawings
- **Pose Estimation Model**: `drawn_humanoid_pose_estimator.mar` - Identifies 17 key joint positions for skeletal rigging
- **External Server**: `http://15.157.188.112:8080` - Pre-configured TorchServe instance with trained models
- **No Local Setup Required**: The AI processing happens on the external server, eliminating the need for local TorchServe installation

The models were trained by Meta AI Research team and are capable of:
- Detecting hand-drawn stick figures and characters
- Automatically identifying body parts and joint locations
- Working with various drawing styles and proportions
- Handling both uploaded images and canvas drawings

## 📡 API Endpoints

### POST `/api/animate`
Generate animation from stick figure image
```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "motion": "dab",
  "output_format": "gif"
}
```

### GET `/api/health`
Check server status
```json
{
  "status": "healthy",
  "torchserve_connected": true,
  "timestamp": 1234567890
}
```

### GET `/api/motions`
List available animation motions
```json
{
  "motions": [
    {"id": "dab", "name": "Dab Dance", "description": "Arm bent dab pose"},
    {"id": "jumping", "name": "Jump", "description": "Jump in place"},
    {"id": "wave_hello", "name": "Wave Hello", "description": "Wave hand greeting"},
    {"id": "zombie", "name": "Zombie Walk", "description": "Walk like a zombie"},
    {"id": "jesse_dance", "name": "Dance", "description": "Dancing motion"}
  ]
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Custom Python path
export PYTHONPATH="/your/project/path:$PYTHONPATH"

# Optional: Custom Flask settings
export FLASK_ENV=development
export FLASK_DEBUG=1
```

### Server Ports
- **Flask API**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **External TorchServe**: http://15.157.188.112:8080 (automatic)

## 🐛 Troubleshooting

### Common Issues

**"flask_cors module not found"**
```bash
pip install flask-cors==4.0.0
```

**"Animation generation failed"**
- Check internet connection (requires external AI server)
- Ensure drawing has clear stick figure with head, body, arms, and legs
- Try uploading a different image

**"Server not responding"**
```bash
# Check if Flask server is running
curl http://localhost:5000/api/health

# Check if frontend server is running
curl http://localhost:3000
```

**Port conflicts**
```bash
# Use different ports
python -m http.server 8000  # Frontend
# And modify animation_api.py to use different port for Flask
```

## 📁 Project Structure

```
metaAPI/
├── README.md                 # This file
├── animation_api.py          # Flask API server
├── index.html               # Vue.js web application
├── requirements.txt         # Python dependencies
├── package.json            # Node.js dependencies (optional)
├── animated_drawings/      # Core animation library
├── examples/               # Example configurations and scripts
├── uploads/               # Temporary uploaded images
└── outputs/              # Generated animations
```

## 🎨 Drawing Tips

For best results:
- Draw clear, simple stick figures
- Include distinct head, body, arms, and legs
- Use black or dark colors on white background
- Avoid overlapping lines
- Make limbs clearly separated
- Keep drawings reasonably proportioned

## 🔐 Security Notes

- Files are automatically cleaned up after processing
- Only image files are accepted for upload
- File size limited to prevent abuse
- No user data is permanently stored

## 📝 Development

### Running in Development Mode
```bash
# Backend with auto-reload
export FLASK_DEBUG=1
python animation_api.py

# Frontend with different port for testing
python -m http.server 8080
```

### Adding New Motions
1. Add BVH file to `examples/bvh/`
2. Create motion config in `examples/config/motion/`
3. Update motion list in `animation_api.py`

## 📄 License

This project is based on Meta's AnimatedDrawings research:
- **Original Paper**: [A Method for Animating Children's Drawings of the Human Figure](https://dl.acm.org/doi/10.1145/3592788)
- **Original Repository**: [facebookresearch/AnimatedDrawings](https://github.com/facebookresearch/AnimatedDrawings)
- **Project Website**: [fairanimateddrawings.com](http://www.fairanimateddrawings.com)

Licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Meta AI Research** for the original AnimatedDrawings algorithm
- **Vue.js team** for the reactive frontend framework
- **Flask community** for the lightweight web framework
- **TorchServe team** for ML model serving infrastructure

## 🚀 Getting Started Now

Ready to bring your drawings to life? Follow the [Quick Start](#-quick-start) guide above and start creating animated characters in minutes!

---

## 🌟 Open Source Appreciation

This project is made possible thanks to the incredible **open source community** and **Meta's commitment to open research**. We are deeply grateful for:

- **Meta AI Research Team** for open-sourcing the groundbreaking AnimatedDrawings algorithm and trained models
- **The broader AI research community** for advancing the field of computer vision and animation
- **Open source contributors** who maintain the libraries and frameworks that power this application
- **The spirit of knowledge sharing** that enables developers worldwide to build upon cutting-edge research

By making their research freely available, Meta has democratized access to advanced AI animation technology, allowing developers, artists, and enthusiasts to create magical experiences from simple drawings. This project stands as a testament to the power of open source collaboration and the positive impact of sharing knowledge for the benefit of all.

**Thank you to everyone who contributes to making AI research accessible and open!** 🙏

---

## 🔗 Original Source

This web application is built upon Meta's groundbreaking AnimatedDrawings research. To explore the original implementation, research papers, and additional examples:

**🏠 Visit the Original Repository:**  
[https://github.com/facebookresearch/AnimatedDrawings](https://github.com/facebookresearch/AnimatedDrawings)

The original repository contains:
- Complete research implementation
- Advanced configuration options
- Additional motion files and character examples
- Docker setup for local TorchServe
- Comprehensive documentation and research insights
- Direct command-line tools for batch processing

---

*Made with ❤️ using Meta's open source AnimatedDrawings AI technology*

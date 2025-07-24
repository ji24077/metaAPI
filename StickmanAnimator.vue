<template>
  <div class="stickman-animator">
    <div class="container">
      <h1>🎨 스틱맨 그리기 → 애니메이션 생성기</h1>
      
      <!-- 그리기 영역 -->
      <div class="drawing-section" v-if="!isProcessing && !animationResult">
        <h2>스틱맨을 그려보세요!</h2>
        <div class="canvas-container">
          <canvas 
            ref="drawingCanvas"
            :width="canvasWidth" 
            :height="canvasHeight"
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
            class="drawing-canvas"
          ></canvas>
        </div>
        
        <div class="controls">
          <button @click="clearCanvas" class="btn btn-secondary">🗑️ 지우기</button>
          <button @click="createAnimation" class="btn btn-primary" :disabled="!hasDrawing">
            ✨ 애니메이션 만들기
          </button>
        </div>
        
        <div class="drawing-tips">
          <p>💡 팁: 머리, 몸통, 팔, 다리가 구분되게 그려주세요!</p>
        </div>
      </div>

      <!-- 처리중 화면 -->
      <div class="processing-section" v-if="isProcessing">
        <div class="loading-container">
          <div class="spinner"></div>
          <h2>🤖 AI가 애니메이션을 생성중...</h2>
          <p>{{ processingMessage }}</p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 애니메이션 결과 화면 -->
      <div class="result-section" v-if="animationResult && !isProcessing">
        <h2>🎉 애니메이션 완성!</h2>
        
        <div class="animation-player">
          <div class="video-container">
            <img 
              ref="animationPlayer"
              :src="animationResult.video_url" 
              alt="생성된 애니메이션"
              class="animation-video"
            />
          </div>
          
          <div class="player-controls">
            <button @click="togglePlay" class="btn btn-play">
              {{ isPlaying ? '⏸️ 일시정지' : '▶️ 재생' }}
            </button>
            <button @click="restartAnimation" class="btn btn-secondary">
              🔄 처음부터
            </button>
            <button @click="downloadAnimation" class="btn btn-success">
              💾 다운로드
            </button>
          </div>
          
          <div class="animation-info">
            <p>📊 처리시간: {{ animationResult.processing_time }}초</p>
            <p>🎬 프레임 수: {{ animationResult.frame_count }}개</p>
          </div>
        </div>

        <div class="restart-section">
          <button @click="resetApp" class="btn btn-outline">
            🎨 새로 그리기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StickmanAnimator',
  data() {
    return {
      // Canvas 설정
      canvasWidth: 600,
      canvasHeight: 400,
      isDrawing: false,
      hasDrawing: false,
      
      // 처리 상태
      isProcessing: false,
      processingMessage: 'AI 모델 준비중...',
      progress: 0,
      
      // 애니메이션 결과
      animationResult: null,
      isPlaying: false,
      
      // 드로잉 설정
      strokeStyle: '#2c3e50',
      lineWidth: 3
    }
  },
  
  mounted() {
    this.initCanvas();
  },
  
  methods: {
    // 캔버스 초기화
    initCanvas() {
      const canvas = this.$refs.drawingCanvas;
      const ctx = canvas.getContext('2d');
      
      // 캔버스 스타일 설정
      ctx.strokeStyle = this.strokeStyle;
      ctx.lineWidth = this.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // 흰색 배경 설정
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    },
    
    // 그리기 시작
    startDrawing(event) {
      this.isDrawing = true;
      const canvas = this.$refs.drawingCanvas;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      
      ctx.beginPath();
      ctx.moveTo(
        event.clientX - rect.left, 
        event.clientY - rect.top
      );
    },
    
    // 그리기
    draw(event) {
      if (!this.isDrawing) return;
      
      const canvas = this.$refs.drawingCanvas;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      
      ctx.lineTo(
        event.clientX - rect.left, 
        event.clientY - rect.top
      );
      ctx.stroke();
      
      this.hasDrawing = true;
    },
    
    // 그리기 종료
    stopDrawing() {
      this.isDrawing = false;
    },
    
    // 캔버스 지우기
    clearCanvas() {
      const canvas = this.$refs.drawingCanvas;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      
      this.hasDrawing = false;
    },
    
    // 애니메이션 생성
    async createAnimation() {
      this.isProcessing = true;
      this.progress = 0;
      
      try {
        // 1단계: 캔버스를 이미지로 변환
        this.processingMessage = '그림을 이미지로 변환중...';
        const canvas = this.$refs.drawingCanvas;
        const imageData = canvas.toDataURL('image/png');
        
        this.progress = 20;
        
        // 2단계: 백엔드 API 호출
        this.processingMessage = 'AI 모델이 캐릭터를 분석중...';
        
        const response = await fetch('/api/animate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageData,
            motion: 'dab', // 기본 모션
            output_format: 'gif'
          })
        });
        
        this.progress = 60;
        this.processingMessage = '3D 애니메이션 생성중...';
        
        if (!response.ok) {
          throw new Error('애니메이션 생성 실패');
        }
        
        const result = await response.json();
        
        this.progress = 100;
        this.processingMessage = '완료!';
        
        // 결과 저장
        this.animationResult = result;
        
      } catch (error) {
        console.error('애니메이션 생성 오류:', error);
        alert('애니메이션 생성에 실패했습니다. 다시 시도해주세요.');
      } finally {
        this.isProcessing = false;
      }
    },
    
    // 애니메이션 재생/일시정지
    togglePlay() {
      const img = this.$refs.animationPlayer;
      
      if (this.isPlaying) {
        // GIF 일시정지 (현재 프레임에서 멈춤)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        
        img.src = canvas.toDataURL();
        this.isPlaying = false;
      } else {
        // GIF 재생 (원본 URL로 복원)
        img.src = this.animationResult.video_url + '?t=' + Date.now();
        this.isPlaying = true;
      }
    },
    
    // 애니메이션 처음부터 재생
    restartAnimation() {
      const img = this.$refs.animationPlayer;
      img.src = this.animationResult.video_url + '?t=' + Date.now();
      this.isPlaying = true;
    },
    
    // 애니메이션 다운로드
    downloadAnimation() {
      const link = document.createElement('a');
      link.href = this.animationResult.video_url;
      link.download = 'stickman_animation.gif';
      link.click();
    },
    
    // 앱 초기화 (새로 그리기)
    resetApp() {
      this.animationResult = null;
      this.isPlaying = false;
      this.clearCanvas();
    }
  }
}
</script>

<style scoped>
.stickman-animator {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.container {
  text-align: center;
}

h1 {
  color: #2c3e50;
  margin-bottom: 30px;
}

h2 {
  color: #34495e;
  margin-bottom: 20px;
}

/* 그리기 영역 */
.drawing-section {
  margin-bottom: 30px;
}

.canvas-container {
  display: inline-block;
  border: 3px solid #3498db;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.drawing-canvas {
  display: block;
  cursor: crosshair;
  background: white;
}

.controls {
  margin-bottom: 15px;
}

.drawing-tips {
  color: #7f8c8d;
  font-style: italic;
}

/* 버튼 스타일 */
.btn {
  padding: 12px 24px;
  margin: 0 8px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
}

.btn-primary {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-success {
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  color: white;
}

.btn-play {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
  font-size: 18px;
}

.btn-outline {
  background: transparent;
  border: 2px solid #3498db;
  color: #3498db;
}

.btn-outline:hover {
  background: #3498db;
  color: white;
}

/* 처리중 화면 */
.processing-section {
  text-align: center;
  padding: 40px;
}

.loading-container h2 {
  color: #3498db;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #ecf0f1;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: #ecf0f1;
  border-radius: 5px;
  overflow: hidden;
  margin-top: 20px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(45deg, #3498db, #2ecc71);
  transition: width 0.3s ease;
}

/* 결과 화면 */
.result-section {
  text-align: center;
}

.animation-player {
  margin-bottom: 30px;
}

.video-container {
  display: inline-block;
  border: 3px solid #27ae60;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.animation-video {
  display: block;
  max-width: 100%;
  height: auto;
  background: white;
}

.player-controls {
  margin-bottom: 20px;
}

.animation-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #495057;
}

.animation-info p {
  margin: 5px 0;
}

.restart-section {
  border-top: 2px solid #ecf0f1;
  padding-top: 20px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .stickman-animator {
    padding: 10px;
  }
  
  .drawing-canvas {
    max-width: 100%;
    height: auto;
  }
  
  .btn {
    padding: 10px 20px;
    font-size: 14px;
    margin: 5px;
  }
}
</style> 
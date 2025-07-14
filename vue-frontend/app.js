const { createApp, ref, reactive, onMounted, nextTick } = Vue;

createApp({
    setup() {
        // 반응형 데이터
        const canvas = ref(null);
        const ctx = ref(null);
        const isDrawing = ref(false);
        const brushSize = ref(5);
        const isDetecting = ref(false);
        const debugLog = ref('');
        const debugLogRef = ref(null);
        const fileInput = ref(null);
        
        const canvasSize = reactive({
            width: 512,
            height: 512
        });

        const apiStatus = reactive({
            text: '확인 중...',
            class: 'status-checking'
        });

        const detectionResults = ref('결과가 여기에 표시됩니다.');
        
        const processingInfo = reactive({
            time: '',
            imageInfo: ''
        });

        // API 설정
        const apiBaseUrl = 'http://localhost:8085';
        const managementApiUrl = 'http://localhost:8086';
        const modelName = 'drawn_humanoid_detector';

        // 드로잉 관련 변수
        let lastX = 0;
        let lastY = 0;

        // 유틸리티 함수
        const log = (message) => {
            const timestamp = new Date().toLocaleTimeString();
            const logMessage = `[${timestamp}] ${message}\n`;
            debugLog.value += logMessage;
            console.log(logMessage);
            
            // 자동 스크롤
            nextTick(() => {
                if (debugLogRef.value) {
                    debugLogRef.value.scrollTop = debugLogRef.value.scrollHeight;
                }
            });
        };

        const getMousePos = (e) => {
            const rect = canvas.value.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const getTouchPos = (e) => {
            const rect = canvas.value.getBoundingClientRect();
            const touch = e.touches[0];
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        };

        // 캔버스 초기화
        const initializeCanvas = () => {
            canvas.value = document.getElementById('drawingCanvas');
            ctx.value = canvas.value.getContext('2d');
            
            // 캔버스 설정
            ctx.value.lineCap = 'round';
            ctx.value.lineJoin = 'round';
            ctx.value.strokeStyle = '#000000';
            ctx.value.lineWidth = brushSize.value;
            
            // 흰색 배경
            ctx.value.fillStyle = '#ffffff';
            ctx.value.fillRect(0, 0, canvasSize.width, canvasSize.height);
            
            log('캔버스 초기화 완료');
        };

        // 드로잉 함수들
        const startDrawing = (e) => {
            isDrawing.value = true;
            const pos = getMousePos(e);
            lastX = pos.x;
            lastY = pos.y;
            
            ctx.value.beginPath();
            ctx.value.moveTo(pos.x, pos.y);
        };

        const draw = (e) => {
            if (!isDrawing.value) return;
            
            const pos = getMousePos(e);
            
            ctx.value.lineTo(pos.x, pos.y);
            ctx.value.stroke();
            
            lastX = pos.x;
            lastY = pos.y;
        };

        const stopDrawing = () => {
            if (!isDrawing.value) return;
            isDrawing.value = false;
            ctx.value.beginPath();
        };

        const handleTouch = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            
            if (e.type === 'touchstart') {
                const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                startDrawing(mouseEvent);
            } else if (e.type === 'touchmove') {
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                draw(mouseEvent);
            }
        };

        const updateBrushSize = () => {
            ctx.value.lineWidth = brushSize.value;
            log(`브러시 크기 변경: ${brushSize.value}px`);
        };

        const clearCanvas = () => {
            ctx.value.clearRect(0, 0, canvasSize.width, canvasSize.height);
            ctx.value.fillStyle = '#ffffff';
            ctx.value.fillRect(0, 0, canvasSize.width, canvasSize.height);
            
            // 결과 초기화
            detectionResults.value = '결과가 여기에 표시됩니다.';
            processingInfo.time = '';
            processingInfo.imageInfo = '';
            
            log('캔버스 초기화됨');
        };

        const handleImageUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            log(`이미지 파일 선택됨: ${file.name} (${Math.round(file.size / 1024)}KB)`);

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // 캔버스 초기화
                    if (ctx.value) {
                        ctx.value.clearRect(0, 0, canvasSize.width, canvasSize.height);
                        ctx.value.fillStyle = '#ffffff';
                        ctx.value.fillRect(0, 0, canvasSize.width, canvasSize.height);
                        
                        // 이미지를 캔버스 크기에 맞게 조정하여 그리기
                        const scale = Math.min(canvasSize.width / img.width, canvasSize.height / img.height);
                        const scaledWidth = img.width * scale;
                        const scaledHeight = img.height * scale;
                        const x = (canvasSize.width - scaledWidth) / 2;
                        const y = (canvasSize.height - scaledHeight) / 2;
                        
                        ctx.value.drawImage(img, x, y, scaledWidth, scaledHeight);
                        
                        log(`이미지가 캔버스에 로드되었습니다. 원본: ${img.width}x${img.height}, 조정: ${Math.round(scaledWidth)}x${Math.round(scaledHeight)}`);
                        
                        // 결과 초기화
                        detectionResults.value = '이미지가 업로드되었습니다. 감지하기 버튼을 눌러주세요.';
                        processingInfo.time = '';
                        processingInfo.imageInfo = `업로드된 이미지: ${file.name}`;
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            
            // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
            event.target.value = '';
        };

        // API 관련 함수들
        const checkApiStatus = async () => {
            apiStatus.text = '확인 중...';
            apiStatus.class = 'status-checking';
            
            try {
                const response = await fetch(`${managementApiUrl}/models`);
                if (response.ok) {
                    const data = await response.json();
                    const models = data.models || [];
                    apiStatus.text = `온라인 (${models.length}개 모델 로드됨)`;
                    apiStatus.class = 'status-online';
                    log(`API 상태: 온라인, 모델 수: ${models.length}`);
                    log(`로드된 모델: ${JSON.stringify(models, null, 2)}`);
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                apiStatus.text = `오프라인 (${error.message})`;
                apiStatus.class = 'status-offline';
                log(`API 상태 확인 실패: ${error.message}`);
            }
        };

        const canvasToBase64 = () => {
            const dataURL = canvas.value.toDataURL('image/jpeg', 0.8);
            return dataURL.split(',')[1];
        };

        const detectHuman = async () => {
            isDetecting.value = true;
            detectionResults.value = '이미지를 분석하고 있습니다...';
            
            const startTime = Date.now();
            
            try {
                // 이미지 데이터 추출
                const base64Image = canvasToBase64();
                const imageSize = Math.round(base64Image.length * 0.75 / 1024);
                
                log(`이미지 변환 완료: ${base64Image.length} 문자, 약 ${imageSize}KB`);
                
                // API 요청 데이터
                const requestData = {
                    instances: [
                        {
                            data: base64Image
                        }
                    ]
                };
                
                log('TorchServe API 호출 시작...');
                
                // TorchServe API 호출 (버전 3.6 사용)
                const response = await fetch(`${apiBaseUrl}/predictions/${modelName}/3.9`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });
                
                const processingTime = Date.now() - startTime;
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                // 결과 표시
                displayResults(result, processingTime, imageSize);
                
            } catch (error) {
                const processingTime = Date.now() - startTime;
                displayError(error, processingTime);
            } finally {
                isDetecting.value = false;
            }
        };

        const displayResults = (result, processingTime, imageSize) => {
            // 처리 시간 및 이미지 정보 업데이트
            processingInfo.time = `처리 시간: ${processingTime}ms`;
            processingInfo.imageInfo = `이미지 크기: ${imageSize}KB (${canvasSize.width}x${canvasSize.height}px)`;
            
            // 결과 파싱 및 표시
            let displayText = '';
            
            if (result.bbox_result && result.segm_result) {
                displayText = `감지 결과:\n`;
                displayText += `- 바운딩 박스: ${result.bbox_result.length}개\n`;
                displayText += `- 세그멘테이션: ${result.segm_result.length}개\n\n`;
                
                if (result.bbox_result.length > 0) {
                    displayText += `바운딩 박스 상세:\n`;
                    result.bbox_result.forEach((bbox, index) => {
                        displayText += `  ${index + 1}. ${JSON.stringify(bbox)}\n`;
                    });
                }
                
                if (result.segm_result.length > 0) {
                    displayText += `\n세그멘테이션 상세:\n`;
                    result.segm_result.forEach((segm, index) => {
                        displayText += `  ${index + 1}. ${JSON.stringify(segm)}\n`;
                    });
                }
                
                if (result.bbox_result.length === 0 && result.segm_result.length === 0) {
                    displayText += '인간 형태가 감지되지 않았습니다.';
                }
            } else {
                displayText = `원시 결과:\n${JSON.stringify(result, null, 2)}`;
            }
            
            detectionResults.value = displayText;
            
            log(`감지 완료: ${processingTime}ms`);
            log(`결과: ${JSON.stringify(result, null, 2)}`);
        };

        const displayError = (error, processingTime) => {
            detectionResults.value = `오류 발생: ${error.message}`;
            processingInfo.time = `처리 시간: ${processingTime}ms (실패)`;
            processingInfo.imageInfo = '';
            
            log(`감지 실패: ${error.message}`);
        };

        // 생명주기 훅
        onMounted(() => {
            log('Vue.js Human Drawing Detector 초기화 시작');
            initializeCanvas();
            checkApiStatus();
            log('초기화 완료');
        });

        // 반환할 데이터와 메서드
        return {
            // 반응형 데이터
            canvasSize,
            brushSize,
            isDetecting,
            apiStatus,
            detectionResults,
            processingInfo,
            debugLog,
            debugLogRef,
            fileInput,
            
            // 메서드
            startDrawing,
            draw,
            stopDrawing,
            handleTouch,
            updateBrushSize,
            clearCanvas,
            handleImageUpload,
            detectHuman,
            checkApiStatus
        };
    }
}).mount('#app'); 
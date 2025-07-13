# Meta AnimatedDrawings API - macOS 설치 및 실행 가이드

## 개요
Meta AnimatedDrawings API를 macOS에서 Python 3.10 conda 가상환경으로 설치 및 실행하는 가이드입니다.

## 시스템 요구사항
- **OS**: macOS (테스트된 버전: darwin 23.6.0)
- **Python**: 3.10 (conda 환경 사용)
- **CUDA**: 미지원 (CPU 모드로 실행)

## 설치된 버전 정보

### Python 및 주요 패키지
- **Python**: 3.10.18 (conda 환경)
- **PyTorch**: 1.13.0 (CPU 버전)
- **TorchServe**: 0.12.0
- **MMCV**: 2.0.1
- **MMDetection**: 3.0.0
- **MMPose**: 1.0.0
- **TorchVision**: 0.14.0

### 핵심 의존성
- **numpy**: 1.24.3
- **opencv-python**: 4.8.1.78
- **xtcocotools**: 소스에서 빌드 설치
- **nvgpu**: GPU 메트릭용 (macOS에서는 불필요)

## 설치 과정

### 1. Conda 환경 생성 및 활성화
```bash
conda create -n metaapi python=3.10
conda activate metaapi
```

### 2. PyTorch 설치 (CPU 버전)
```bash
pip install torch==1.13.0 torchvision==0.14.0 --index-url https://download.pytorch.org/whl/cpu
```

### 3. TorchServe 설치
```bash
pip install torchserve torch-model-archiver torch-workflow-archiver
```

### 4. MMEngine 및 MM 라이브러리 설치
```bash
pip install mmengine
pip install mmcv==2.0.1
pip install mmdet==3.0.0
pip install mmpose==1.0.0
```

### 5. xtcocotools 설치 (소스에서 빌드)
```bash
pip install cython
git clone https://github.com/jin-s13/xtcocotools.git
cd xtcocotools
python setup.py build_ext install
```

### 6. 기타 의존성 설치
```bash
pip install opencv-python
pip install pillow
pip install requests
```

## 🚨 해결된 주요 문제점들 및 수정사항

### 1. 의존성 버전 충돌 문제

#### numpy 버전 문제
**문제**: `numpy 1.26.0`과 `torch 1.13.0` 호환성 문제
**해결**: numpy를 1.24.3으로 다운그레이드
```bash
pip install numpy==1.24.3
```

#### pip/mim 경로 문제
**문제**: `pip`와 `mim` 명령어가 conda 환경에서 인식되지 않음
**해결**: 전체 경로 사용
```bash
/opt/anaconda3/envs/metaapi/bin/pip install mmcv==2.0.1
/opt/anaconda3/envs/metaapi/bin/mim install mmcv==2.0.1
```

#### mmcv-full 설치 시 torch 미설치 문제
**문제**: mmcv-full 설치 시 torch가 설치되지 않음
**해결**: torch 먼저 설치 후 mmcv 설치
```bash
pip install torch==1.13.0 torchvision==0.14.0 --index-url https://download.pytorch.org/whl/cpu
pip install mmcv==2.0.1
```

### 2. xtcocotools 빌드 실패 문제

**문제**: `xtcocotools` 설치 시 컴파일 에러
**해결**: 소스에서 직접 빌드 및 설치
```bash
pip install cython
git clone https://github.com/jin-s13/xtcocotools.git
cd xtcocotools
python setup.py build_ext install
```

### 3. 핸들러 모듈 누락 문제

**문제**: `ModuleNotFoundError: No module named 'ts.torch_handler.mmpose_handler'`
**원인**: .mar 파일에서 핸들러 파일이 누락됨
**해결**: 
1. .mar 파일에서 핸들러 추출
2. site-packages/torch_handler 폴더에 복사
3. 핸들러 파일 수정

#### 핸들러 추출 및 복사
```bash
# .mar 파일 압축 해제
cd tmp_mar/pose_estimator
jar -xf drawn_humanoid_pose_estimator.mar

# 핸들러 파일을 torch_handler 폴더에 복사
cp mmpose_handler.py /opt/anaconda3/envs/metaapi/lib/python3.10/site-packages/ts/torch_handler/
```

### 4. 핸들러 API 호환성 문제

#### MMPose 1.0.0 API 변경사항
**문제**: MMPose 1.0.0에서 API 변경으로 인한 호환성 문제
**해결**: 핸들러 코드를 새로운 API에 맞게 수정

**변경된 함수들**:
- `init_pose_model()` → `init_model()`
- `inference_model()` → `inference_topdown()`

#### 수정된 핸들러 코드
```python
# 기존 코드
model = init_pose_model(config_file, checkpoint, device=device)

# 수정된 코드
model = init_model(config_file, checkpoint, device=device)

# 기존 코드
pose_results = inference_model(model, img, person_results, bbox_thr=0.3, format='xyxy', dataset=dataset)

# 수정된 코드
pose_results = inference_topdown(model, img, person_results, bbox_thr=0.3, format='xyxy', dataset=dataset)
```

### 5. CUDA 관련 문제들

#### CUDA 미지원 문제
**문제**: macOS에서 CUDA 미지원으로 인한 오류
**해결**: CPU 모드 강제 설정

#### MockCuda 클래스 중복 문제
**문제**: 핸들러 파일에 MockCuda 클래스가 중복 정의됨
**해결**: 중복 클래스 제거

#### torch.device 오버라이드 무한 재귀 문제
**문제**: torch.device를 오버라이드할 때 무한 재귀 발생
**해결**: 더 안전한 방법으로 CUDA 차단
```python
# CUDA 완전 차단
os.environ['CUDA_VISIBLE_DEVICES'] = ""
torch.cuda.is_available = lambda: False
```

### 6. Config 파일 문제들

#### JSON 형식 오류
**문제**: config.properties의 JSON 형식 오류
**해결**: 파일 정리 및 올바른 형식으로 수정

#### 공백 문제
**문제**: config.properties의 값에 공백 포함
**해결**: 공백 제거

### 7. .mar 파일 패키징 문제

#### config.py 누락 문제
**문제**: .mar 파일에 config.py가 포함되지 않음
**해결**: --extra-files 옵션으로 config.py 포함
```bash
torch-model-archiver --model-name drawn_humanoid_pose_estimator \
  --version 1.0 \
  --serialized-file best_AP_epoch_72.pth \
  --handler mmpose_handler.py \
  --extra-files config.py \
  --export-path model-store
```

#### 압축 오류로 인한 .mar 파일 손상
**문제**: .mar 파일 압축 중 오류로 파일 손상
**해결**: .mar 파일 재생성

### 8. 입력 데이터 형식 문제

#### Base64 인코딩 문제
**문제**: "Input must be base64-encoded string in 'data' or 'body' field." 오류
**해결**: 핸들러의 preprocess 함수 수정

#### 수정된 preprocess 함수
```python
def preprocess(self, data):
    if isinstance(data, list):
        data = data[0]
    
    if isinstance(data, dict):
        # JSON 요청에서 base64 문자열 추출
        if 'data' in data:
            base64_string = data['data']
        elif 'body' in data:
            base64_string = data['body']
        else:
            raise ValueError("Input must be base64-encoded string in 'data' or 'body' field.")
    else:
        # 직접 base64 문자열인 경우
        base64_string = data
    
    # base64 디코딩
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data))
    return image
```

### 9. Python 환경 문제

#### TorchServe가 잘못된 Python 사용
**문제**: TorchServe가 base 환경의 Python 3.12를 사용
**해결**: conda 환경의 Python 3.10을 명시적으로 지정
```bash
/opt/anaconda3/envs/metaapi/bin/torchserve --start --model-store model-store --ts-config config.properties
```

## 핵심 문제점 및 해결방법

### 1. CUDA 문제
**문제**: "Torch not compiled with CUDA enabled" 에러
**원인**: macOS에서 CUDA 미지원
**해결**: CPU 모드로 강제 실행

### 2. 핸들러 모듈 문제
**문제**: `ModuleNotFoundError: No module named 'ts.torch_handler.mmpose_handler.py'`
**원인**: .mar 파일의 MANIFEST.json에서 핸들러 이름에 .py 확장자 포함
**해결**: MANIFEST.json에서 .py 확장자 제거

### 3. Python 환경 문제
**문제**: TorchServe가 base 환경의 Python 3.12를 사용
**원인**: conda 환경이 제대로 활성화되지 않음
**해결**: conda 환경의 Python 3.10을 명시적으로 지정

### 4. Config 설정 문제
**문제**: `NumberFormatException: For input string: "100000000 "`
**원인**: config.properties의 공백 문제
**해결**: config.properties 파일 정리

## 핸들러 수정사항

### CUDA 완전 차단
핸들러 파일에 다음 코드 추가:
```python
# CUDA 완전 차단
os.environ['CUDA_VISIBLE_DEVICES'] = ""
torch.cuda.is_available = lambda: False
torch.cuda.device = lambda *args, **kwargs: torch.device('cpu')
```

### Device 강제 설정
```python
self.model = init_detector(self.config_file, checkpoint, device='cpu')
```

## 서버 실행 방법

### 중요: 올바른 환경에서 실행
**반드시 conda 환경을 활성화하고 Python 3.10을 명시적으로 지정해야 합니다.**

```bash
# 1. 프로젝트 디렉토리로 이동
cd /Users/jisunghan/CSCC09/metaA

# 2. conda 환경 활성화
conda activate metaapi

# 3. 환경 확인
which python  # /opt/anaconda3/envs/metaapi/bin/python3.10 확인
python --version  # Python 3.10.18 확인

# 4. TorchServe 실행 (올바른 환경에서)
export TS_DISABLE_TOKEN_AUTHORIZATION=true
export CUDA_VISIBLE_DEVICES=""
/opt/anaconda3/envs/metaapi/bin/torchserve --start --model-store model-store --ts-config config.properties --disable-token-auth --foreground
```

### 한 번에 실행하는 명령어
```bash
cd /Users/jisunghan/CSCC09/metaA && conda activate metaapi && export TS_DISABLE_TOKEN_AUTHORIZATION=true && export CUDA_VISIBLE_DEVICES="" && /opt/anaconda3/envs/metaapi/bin/torchserve --start --model-store model-store --ts-config config.properties --disable-token-auth --foreground
```

## 설정 파일

### config.properties
```properties
inference_address=http://0.0.0.0:8085
management_address=http://0.0.0.0:8086
metrics_address=http://127.0.0.1:8082
number_of_netty_threads=4
job_queue_size=10
model_store=model-store
load_models=all
max_response_size=100000000
max_request_size=100000000
default_workers_per_model=1
disable_token_authorization=true
```

## API 엔드포인트

### 추론 엔드포인트
- **인체 감지**: `http://localhost:8085/predictions/drawn_humanoid_detector`
- **포즈 추정**: `http://localhost:8085/predictions/drawn_humanoid_pose_estimator`

### 관리 엔드포인트
- **모델 목록**: `http://localhost:8086/models`
- **상태 확인**: `http://localhost:8085/ping`

## 테스트 방법

### 서버 상태 확인
```bash
curl -X GET http://localhost:8085/ping
```

### 모델 등록 확인
```bash
curl -X GET http://localhost:8086/models
```

### 이미지 추론 테스트
```bash
curl -X POST http://localhost:8085/predictions/drawn_humanoid_detector \
  -T /path/to/your/image.jpg \
  -H "Content-Type: image/jpeg"
```

## 주의사항

### 1. 환경 활성화 필수
- **반드시** `conda activate metaapi` 실행 후 TorchServe 시작
- base 환경의 Python 3.12 사용 시 torch 모듈을 찾지 못함

### 2. CUDA 관련
- macOS에서는 CUDA 미지원으로 CPU 모드만 사용 가능
- 핸들러에서 CUDA 완전 차단 필요

### 3. 포트 사용
- 추론: 8085
- 관리: 8086
- 메트릭: 8082

### 4. 로그 확인
- 로그 파일: `logs/ts_log.log`
- 실시간 로그: `tail -f logs/ts_log.log`

## 문제 해결

### TorchServe 중지
```bash
torchserve --stop
pkill -f torchserve
```

### 프로세스 확인
```bash
ps aux | grep torchserve
```

### 환경 확인
```bash
conda info --envs
which python
python --version
```

## 성공적인 실행 확인

모든 설정이 올바르면 다음과 같은 메시지가 나타납니다:
- ✅ TorchServe 시작: "Torchserve version: 0.12.0"
- ✅ Python 환경: "Python executable: /opt/anaconda3/envs/metaapi/bin/python3.10"
- ✅ 모델 로딩: "Loading models from model store"
- ✅ API 응답: `{"status": "Healthy"}`

## 🎉 최종 성공 상태

현재 두 모델이 모두 성공적으로 로드되어 `READY` 상태로 정상 작동 중입니다:

### 모델 상태
- **drawn_humanoid_detector**: READY ✅ (워커 ID: 9001, PID: 50232)
- **drawn_humanoid_pose_estimator**: READY ✅ (워커 ID: 9000, PID: 50207, 메모리: ~4MB)

### API 응답 예시
```json
{
  "models": [
    {
      "modelName": "drawn_humanoid_detector",
      "modelUrl": "drawn_humanoid_detector.mar"
    },
    {
      "modelName": "drawn_humanoid_pose_estimator",
      "modelUrl": "drawn_humanoid_pose_estimator.mar"
    }
  ]
}
```

## 라이센스
이 프로젝트는 Meta의 AnimatedDrawings API를 기반으로 합니다. 
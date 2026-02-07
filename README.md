# Room3D
> **Image-to-3D Generation & Virtual Arrangement Service**<br>
> 충남대학교 학습동아리 **'아나줘요(Give Me ANA)'** 최종 결과물

## 프로젝트 소개 (Overview)
**Room3D**는 사용자가 업로드한 2D 이미지를 3D 오브젝트로 변환하여 가상 공간에 배치해 볼 수 있는 웹 서비스입니다. 
클라이언트-서버 구조를 기반으로 하며, 고성능 연산이 필요한 3D 변환 작업은 **Modal 클라우드** 상의 GPU 인스턴스를 활용해 처리합니다.

생성된 3D 모델은 사용자가 자유롭게 확인하고 가구 배치 시뮬레이션을 진행할 수 있습니다.

## 시스템 아키텍처 (Architecture)
데이터 처리 및 3D 변환 파이프라인은 다음과 같이 구성됩니다.

1. **Client**: 사용자로부터 이미지 입력을 받고, 렌더링된 3D 뷰어 및 배치 UI를 제공합니다.
2. **Server**: 클라이언트 요청을 중계하고 데이터 흐름을 제어합니다.
3. **Modal Cloud (GPU)**: [Facebook Research의 VGGT](https://github.com/facebookresearch/vggt) 오픈소스를 활용하여 파이썬 기반의 3D 연산을 수행합니다.

> **Flow**: `User Image` → `Client` → `Server` → `Modal Cloud (VGGT Inference)` → `Server` → `Client` → `3D Viewer`


## 디렉토리 구조 (Directory Structure)

본 프로젝트는 기능별로 모듈화된 폴더 구조를 가집니다.

```bash
Room3D/
├── client/     # 프론트엔드/클라이언트 소스 코드
├── server/     # 백엔드/서버 소스 코드
├── vggt/       # Modal 클라우드 배포용 VGGT 파이썬 코드
└── docker-compose.yml
```


## 실행 가이드 (Getting Started)

프로젝트 실행 방법은 두 가지가 있으며, **Docker Compose를 이용한 방법(Method 1)을 권장**합니다.

### Method 1: Docker Compose (권장)
Docker 엔진이 실행 중인지 확인한 후, 프로젝트 최상위 루트에서 아래 명령어를 입력하세요. 클라이언트와 서버 컨테이너가 자동으로 빌드되고 실행됩니다.

```bash
docker compose up --build -d
```

### Method 2: Manual Setup (수동 실행)
로컬 환경에서 개발 모드로 실행하려면 각 폴더에서 패키지를 설치하고 실행해야 합니다.

**Server**
```bash
cd server
npm run dev
```

**Client**
```bash
cd client
npm run dev
```
이후 터미널에 표시되는 로컬 주소(예: `http://localhost:3000`)로 접속합니다.


## 프로젝트 연혁 (History)
이 저장소는 초기 아이디어 검증부터 기능 확장을 거쳐 통합된 최종 결과물입니다. 이전 개발 단계는 아래 저장소에서 확인할 수 있습니다.

* **Phase 1**: [Room3D 레포지토리](https://github.com/Hraverals/Room3D) - *초기 프로토타입*
* **Phase 2**: [glb_viewer_test 레포지토리](https://github.com/Hraverals/glb_viewer_test) - *가구 배치 기능 구현 및 Three.js 테스트*


## 기술 스택 (Tech Stack)
* **Infrastructure**: Docker, Modal Cloud
* **Core AI**: VGGT (Facebook Research)
* **Frontend**: (Client Framework, e.g., React/Vite/Three.js)
* **Backend**: (Server Runtime, e.g., Node.js)


## 추후 개선 사항
* 로그인 및 가입 구현 - 이 프로젝트는 완전히 부동산 앱을 만들기보다는 사진을 3D로 변환시켜서 보여주는 시현 느낌이라 로그인은 주제에서 조금 벗어나는 느낌이라 보류하였음
* 클라우드 서비스 - 24시간에 한 번 겨우 되는 Huggingface api에서 Modal로 플랫폼을 바꾼 이후로 변환이 훨씬 더 자유로워졌으나, 이는 어쨌거나 개인 테스트 입장이지 유저가 몇십 명만 몰려도 금전적 문제가 무조건 발생하게됨. 조금 더 가볍게 돌릴 수 있는 방법이나 다른 개선 방법이 필요함
* 배포 - 컨테이너의 휘발성으로 인해 이미지와 glb파일을 저장할 공간이 따로 필요하기 때문에, aws를 통해 s3를 활용하여 배포할 생각임

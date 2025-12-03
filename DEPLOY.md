# 배포 가이드

이 프로젝트를 배포하는 여러 방법을 안내합니다.

## 🚀 배포 방법

### 방법 1: Netlify (가장 간단, 추천)

1. **Netlify 가입**
   - https://www.netlify.com 접속
   - GitHub 계정으로 가입 (또는 이메일로 가입)

2. **프로젝트 업로드**
   - Netlify 대시보드에서 "Add new site" > "Deploy manually" 클릭
   - 프로젝트 폴더 전체를 드래그 앤 드롭
   - 또는 "Deploy with GitHub" 선택하여 GitHub 저장소 연결

3. **배포 완료**
   - 자동으로 배포 URL이 생성됩니다
   - 예: `https://your-site-name.netlify.app`

4. **도메인 설정 (선택사항)**
   - Site settings > Domain management에서 커스텀 도메인 설정 가능

---

### 방법 2: Vercel

1. **Vercel 가입**
   - https://vercel.com 접속
   - GitHub 계정으로 가입

2. **프로젝트 배포**
   - "Add New Project" 클릭
   - GitHub 저장소를 연결하거나 폴더를 업로드
   - Vercel이 자동으로 설정을 감지합니다

3. **배포 완료**
   - 자동으로 배포 URL이 생성됩니다
   - 예: `https://your-site-name.vercel.app`

---

### 방법 3: GitHub Pages

1. **GitHub 저장소 생성**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/image-upload.git
   git push -u origin main
   ```

2. **GitHub Pages 활성화**
   - GitHub 저장소 페이지로 이동
   - Settings > Pages 클릭
   - Source: "Deploy from a branch" 선택
   - Branch: "main" 선택
   - Folder: "/ (root)" 선택
   - Save 클릭

3. **배포 완료**
   - 몇 분 후 배포 URL이 생성됩니다
   - 예: `https://your-username.github.io/image-upload`

---

### 방법 4: 직접 서버에 업로드

1. **FTP/SFTP 사용**
   - FileZilla, Cyberduck 등의 FTP 클라이언트 사용
   - 웹 호스팅 서버에 모든 파일 업로드
   - `index.html`이 루트 디렉토리에 있어야 합니다

2. **SSH 사용**
   ```bash
   scp -r * user@your-server.com:/var/www/html/
   ```

---

## ⚠️ 배포 전 확인사항

1. **Apps Script 웹앱 URL 확인**
   - `script.js` 파일의 `UPLOAD_ENDPOINT`가 올바른지 확인
   - 배포된 Apps Script 웹앱 URL과 일치하는지 확인

2. **Apps Script 배포 설정 확인**
   - 액세스 권한: "링크가 있는 모든 사용자" 또는 "모든 사용자"
   - 실행 권한: "본인"

3. **HTTPS 사용**
   - 대부분의 배포 서비스는 자동으로 HTTPS를 제공합니다
   - HTTPS가 필수인 경우 (카메라 접근 등) 확인하세요

---

## 🔧 배포 후 테스트

1. 배포된 URL에서 페이지 열기
2. 이미지 선택 및 업로드 테스트
3. 구글 드라이브 폴더에 파일이 저장되는지 확인
4. 모바일에서도 테스트 (필요한 경우)

---

## 📝 문제 해결

### CORS 에러가 발생하는 경우
- Apps Script 웹앱의 배포 설정을 확인하세요
- 액세스 권한이 올바르게 설정되었는지 확인하세요

### 이미지가 업로드되지 않는 경우
- 브라우저 콘솔(F12)에서 에러 메시지 확인
- Apps Script 웹앱 URL이 올바른지 확인
- 구글 드라이브 폴더 ID가 올바른지 확인

---

## 💡 추천 배포 방법

**개인 프로젝트**: Netlify (가장 간단)
**팀 프로젝트**: Vercel (GitHub 연동 편리)
**무료 호스팅**: GitHub Pages (완전 무료)


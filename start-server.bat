@echo off
REM Windows용 로컬 웹 서버 실행 스크립트
REM 이 스크립트를 실행하면 http://localhost:8000 에서 페이지를 열 수 있습니다

echo 로컬 웹 서버를 시작합니다...
echo 브라우저에서 http://localhost:8000 을 열어주세요.
echo 서버를 중지하려면 Ctrl+C를 누르세요.
echo.

REM Python 3가 설치되어 있는지 확인
python --version >nul 2>&1
if %errorlevel% == 0 (
    python -m http.server 8000
) else (
    python3 --version >nul 2>&1
    if %errorlevel% == 0 (
        python3 -m http.server 8000
    ) else (
        echo Python이 설치되어 있지 않습니다.
        echo Node.js를 사용하여 서버를 시작합니다...
        
        REM Node.js가 설치되어 있는지 확인
        npx --version >nul 2>&1
        if %errorlevel% == 0 (
            npx http-server -p 8000
        ) else (
            echo Python 또는 Node.js가 필요합니다.
            echo 다음 중 하나를 설치해주세요:
            echo   - Python 3: https://www.python.org/downloads/
            echo   - Node.js: https://nodejs.org/
            pause
            exit /b 1
        )
    )
)


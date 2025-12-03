// ============================================
// Google Apps Script 웹앱 코드
// ============================================
// 사용 방법:
// 1. 구글 드라이브에서 "새로 만들기" > "Google Apps Script" 선택
// 2. 아래 코드를 붙여넣기
// 3. FOLDER_ID를 실제 폴더 ID로 변경
// 4. "배포" > "새 배포" > "웹 앱" 선택
// 5. 실행 권한: "본인", 액세스 권한: "링크가 있는 모든 사용자"
// 6. 배포 후 나온 웹앱 URL을 script.js의 UPLOAD_ENDPOINT에 입력

// 업로드를 저장할 구글 드라이브 폴더 ID
// 예: https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j
//     여기서 1a2b3c4d5e6f7g8h9i0j 부분이 폴더 ID입니다
const FOLDER_ID = '여기에_폴더_ID_입력';

// CORS preflight 요청 처리
function doOptions(e) {
  return createCorsResponse();
}

function doPost(e) {
  try {
    let base64, fileName, mimeType;
    
    // 폼 데이터 또는 JSON 데이터 확인
    if (e.parameter && e.parameter.base64) {
      // HTML 폼으로 전송된 경우
      base64 = e.parameter.base64;
      fileName = e.parameter.fileName || 'upload_' + new Date().getTime() + '.jpg';
      mimeType = e.parameter.mimeType || 'image/jpeg';
    } else if (e.postData && e.postData.contents) {
      // JSON으로 전송된 경우
      let data;
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        return createJsonResponse({ 
          success: false, 
          message: 'Invalid JSON: ' + parseError.toString() 
        }, 400);
      }
      base64 = data.base64;
      fileName = data.fileName || 'upload_' + new Date().getTime() + '.jpg';
      mimeType = data.mimeType || 'image/jpeg';
    } else {
      return createJsonResponse({ 
        success: false, 
        message: 'No data received' 
      }, 400);
    }

    // Base64 데이터 확인
    if (!base64 || typeof base64 !== 'string') {
      return createJsonResponse({ 
        success: false, 
        message: 'No base64 data provided' 
      }, 400);
    }

    // 폴더 확인
    let folder;
    try {
      folder = DriveApp.getFolderById(FOLDER_ID);
    } catch (folderError) {
      return createJsonResponse({ 
        success: false, 
        message: 'Folder not found. Check FOLDER_ID: ' + folderError.toString() 
      }, 500);
    }

    // Base64를 바이너리로 변환
    let bytes;
    try {
      bytes = Utilities.base64Decode(base64);
    } catch (decodeError) {
      return createJsonResponse({ 
        success: false, 
        message: 'Base64 decode error: ' + decodeError.toString() 
      }, 400);
    }

    // Blob 생성 및 파일 저장
    try {
      const blob = Utilities.newBlob(bytes, mimeType, fileName);
      const file = folder.createFile(blob);

      // 성공 응답
      return createJsonResponse({
        success: true,
        fileId: file.getId(),
        fileUrl: file.getUrl(),
        fileName: file.getName(),
        message: 'File uploaded successfully'
      });
    } catch (fileError) {
      return createJsonResponse({ 
        success: false, 
        message: 'File creation error: ' + fileError.toString() 
      }, 500);
    }

  } catch (err) {
    // 예상치 못한 에러
    return createJsonResponse({
      success: false,
      message: 'Unexpected error: ' + err.toString()
    }, 500);
  }
}

// CORS 헤더가 포함된 응답 생성 함수
function createCorsResponse() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// JSON 응답 생성 함수 (CORS 헤더 포함)
function createJsonResponse(obj, statusCode) {
  const output = ContentService.createTextOutput(
    JSON.stringify(obj)
  ).setMimeType(ContentService.MimeType.JSON);
  
  return output;
}

// 테스트용 함수 (선택사항)
function testUpload() {
  // 이 함수는 Apps Script 에디터에서 직접 실행하여 테스트할 수 있습니다
  const testData = {
    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 픽셀 PNG
    fileName: 'test.png',
    mimeType: 'image/png'
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}


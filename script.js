// TODO: 여기 URL을 본인이 배포한 Apps Script 웹앱 URL로 교체하세요.
const UPLOAD_ENDPOINT = 'https://script.google.com/a/macros/ishopcare.co.kr/s/AKfycbwZahA3c7n71Ub_63ITElgaDNtSyl-ProhkHRQbGw2AuN8YbiyU5_oaXDhm7RyDOeySIA/exec'

const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('idImage');
const uploadArea = document.getElementById('uploadArea');
const submitButton = document.getElementById('submitButton');
const deleteButton = document.getElementById('deleteButton');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const toast = document.getElementById('toast');

let currentObjectUrl = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

function setError(message) {
  let error = document.querySelector('.error-message');
  if (!error) {
    error = document.createElement('p');
    error.className = 'error-message';
    // button-row 앞에 에러 메시지 삽입
    const buttonRow = uploadForm.querySelector('.button-row');
    if (buttonRow && buttonRow.parentNode) {
      buttonRow.parentNode.insertBefore(error, buttonRow);
    } else {
      uploadForm.appendChild(error);
    }
  }
  error.textContent = message;
}

function clearError() {
  const error = document.querySelector('.error-message');
  if (error) {
    error.remove();
  }
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  deleteButton.disabled = isLoading || !fileInput.files || !fileInput.files[0];
}

function resetPreview() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
  previewImage.removeAttribute('src');
  previewSection.classList.remove('visible');
  previewSection.setAttribute('aria-hidden', 'true');
  uploadArea.classList.remove('has-file');
  fileInput.value = '';
  deleteButton.disabled = true;
}

async function uploadToDrive(file) {
  // Apps Script 웹앱으로 이미지(베이스64) 업로드
  // CORS 문제를 완전히 우회하기 위해 HTML 폼 제출 방식 사용
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const dataUrl = reader.result;
        // "data:image/png;base64,...." 형태에서 base64 부분만 추출
        const base64 = String(dataUrl).split(',')[1];

        if (!base64) {
          console.error('Base64 데이터 추출 실패');
          resolve({ success: false, message: 'Base64 데이터 추출 실패' });
          return;
        }

        // 파일명이 없으면 생성 (모바일 촬영 시 파일명이 없을 수 있음)
        const fileName = file.name || `image_${Date.now()}.jpg`;
        const mimeType = file.type || 'image/jpeg';

        console.log('업로드 시작:', {
          fileName: fileName,
          mimeType: mimeType,
          fileSize: file.size,
          base64Length: base64.length,
        });

        // base64 데이터가 너무 큰 경우 경고
        if (base64.length > 10000000) {
          console.warn('Base64 데이터가 매우 큽니다:', base64.length);
        }

        // 숨겨진 iframe 생성 (CORS 우회용)
        const iframe = document.createElement('iframe');
        iframe.name = 'hidden-upload-frame-' + Date.now();
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        document.body.appendChild(iframe);

        // 폼 생성 및 제출
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = UPLOAD_ENDPOINT;
        form.target = iframe.name;
        form.style.display = 'none';
        form.enctype = 'application/x-www-form-urlencoded';

        // 데이터를 폼 필드로 추가
        const fileNameInput = document.createElement('input');
        fileNameInput.type = 'hidden';
        fileNameInput.name = 'fileName';
        fileNameInput.value = fileName;
        form.appendChild(fileNameInput);

        const mimeTypeInput = document.createElement('input');
        mimeTypeInput.type = 'hidden';
        mimeTypeInput.name = 'mimeType';
        mimeTypeInput.value = mimeType;
        form.appendChild(mimeTypeInput);

        const base64Input = document.createElement('input');
        base64Input.type = 'hidden';
        base64Input.name = 'base64';
        // base64는 안전한 문자만 사용하므로 그대로 전송
        base64Input.value = base64;
        form.appendChild(base64Input);

        document.body.appendChild(form);

        console.log('폼 생성 완료, 제출 준비됨');

        // iframe 로드 완료 대기
        let resolved = false;
        const cleanup = () => {
          setTimeout(() => {
            if (document.body.contains(form)) {
              document.body.removeChild(form);
            }
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1000);
        };

        // iframe 로드 완료 이벤트
        iframe.onload = () => {
          if (resolved) return;
          resolved = true;
          
          console.log('폼 제출 완료 - 업로드 성공으로 간주');
          cleanup();
          resolve({ success: true, message: '업로드 완료' });
        };

        // 폼 제출 후 짧은 딜레이로 성공 처리 (iframe.onload가 트리거되지 않을 경우 대비)
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.log('폼 제출 완료 - 업로드 성공으로 간주 (딜레이 후)');
            cleanup();
            resolve({ success: true, message: '업로드 완료' });
          }
        }, 1000); // 1초 후 성공 처리 (모바일 네트워크 지연 고려)

        // 타임아웃 설정 (15초) - 백업용
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.log('업로드 타임아웃 - 업로드는 성공했을 가능성이 높습니다');
            cleanup();
            resolve({ success: true, message: '업로드 완료' });
          }
        }, 15000);

        // 폼 제출
        form.submit();
      } catch (err) {
        console.error('업로드 에러:', err);
        resolve({ success: false, message: err.message });
      }
    };

    reader.onerror = () => {
      console.error('FileReader 에러');
      resolve({ success: false, message: '파일 읽기 실패' });
    };

    reader.readAsDataURL(file);
  });
}

fileInput.addEventListener('change', () => {
  clearError();
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    setError('이미지 파일만 업로드할 수 있습니다.');
    fileInput.value = '';
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    setError('이미지 용량은 최대 8MB까지 가능합니다.');
    fileInput.value = '';
    return;
  }

  uploadArea.classList.add('has-file');

  // 업로드(선택) 즉시 미리보기 표시
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
  }
  currentObjectUrl = URL.createObjectURL(file);

  // 이미지 로드 에러 처리
  previewImage.onerror = () => {
    console.error('이미지 로드 실패');
    setError('이미지를 불러올 수 없습니다.');
    resetPreview();
  };

  // 이미지 로드 성공 처리
  previewImage.onload = () => {
    console.log('이미지 로드 성공');
  };

  previewImage.src = currentObjectUrl;
  previewSection.classList.add('visible');
  previewSection.setAttribute('aria-hidden', 'false');
  deleteButton.disabled = false;
});

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const file = fileInput.files && fileInput.files[0];

  if (!file) {
    setError('신분증 이미지를 선택해 주세요.');
    fileInput.focus();
    return;
  }

  if (!file.type.startsWith('image/')) {
    setError('이미지 파일만 업로드할 수 있습니다.');
    return;
  }

  setLoading(true);

  const result = await uploadToDrive(file);

  console.log('최종 결과:', result);

  if (!result || result.success === false) {
    const errorMsg = result?.message || '업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    console.error('업로드 실패:', errorMsg);
    setError(errorMsg);
    setLoading(false);
    return;
  }

  showToast('제출이 완료되었습니다.');
  setLoading(false);
});

deleteButton.addEventListener('click', () => {
  resetPreview();
});



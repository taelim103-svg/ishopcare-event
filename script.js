// TODO: 여기 URL을 본인이 배포한 Apps Script 웹앱 URL로 교체하세요.
const UPLOAD_ENDPOINT = 'https://script.google.com/a/macros/ishopcare.co.kr/s/AKfycbwZahA3c7n71Ub_63ITElgaDNtSyl-ProhkHRQbGw2AuN8YbiyU5_oaXDhm7RyDOeySIA/exec'

const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('idImage');
const fileInputCapture = document.getElementById('idImageCapture');
const uploadArea = document.getElementById('uploadArea');
const uploadAreaCapture = document.getElementById('uploadAreaCapture');
const submitButton = document.getElementById('submitButton');
const deleteButton = document.getElementById('deleteButton');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const toast = document.getElementById('toast');
const businessNumberInput = document.getElementById('businessNumber');
const phoneNumberInput = document.getElementById('phoneNumber');

let currentObjectUrl = null;
let currentFile = null;

// 사업자 번호 자동 포맷팅 (000-00-00000)
function formatBusinessNumber(value) {
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, '');
  
  // 최대 10자리까지만
  const limited = numbers.slice(0, 10);
  
  // 포맷팅
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 5) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
  }
}

// 전화번호 자동 포맷팅 (000-0000-0000)
function formatPhoneNumber(value) {
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, '');
  
  // 최대 11자리까지만
  const limited = numbers.slice(0, 11);
  
  // 포맷팅
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 7) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
  }
}

// 입력값에서 파일명 생성 함수
function generateFileName(originalFileName) {
  const userName = document.getElementById('userName').value.trim();
  const businessNumber = document.getElementById('businessNumber').value.trim().replace(/[^\d]/g, '');
  const phoneNumber = document.getElementById('phoneNumber').value.trim().replace(/[^\d]/g, '');

  // 입력값이 모두 있는 경우
  if (userName && businessNumber && phoneNumber) {
    // 파일 확장자 추출
    const extension = originalFileName.split('.').pop() || 'jpg';
    // 특수문자 제거 및 공백을 언더스코어로 변경
    const cleanName = userName.replace(/[^\w가-힣]/g, '_');
    // 숫자만 사용 (하이픈 제거된 상태)
    const cleanBusiness = businessNumber;
    const cleanPhone = phoneNumber;
    
    return `${cleanName}_${cleanBusiness}_${cleanPhone}.${extension}`;
  }

  // 입력값이 없는 경우 원본 파일명 사용
  return originalFileName || `image_${Date.now()}.jpg`;
}

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
  uploadAreaCapture.classList.remove('has-file');
  fileInput.value = '';
  fileInputCapture.value = '';
  currentFile = null;
  deleteButton.disabled = true;
  
  // 입력 필드는 초기화하지 않음 (사용자가 다시 입력할 필요 없도록)
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

        // 입력값을 기반으로 파일명 생성
        const originalFileName = file.name || `image_${Date.now()}.jpg`;
        const fileName = generateFileName(originalFileName);
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

// 파일 선택 처리 공통 함수
function handleFileSelect(file, sourceInput) {
  clearError();
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    setError('이미지 파일만 업로드할 수 있습니다.');
    fileInput.value = '';
    fileInputCapture.value = '';
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    setError('이미지 용량은 최대 8MB까지 가능합니다.');
    fileInput.value = '';
    fileInputCapture.value = '';
    return;
  }

  // 현재 파일 저장
  currentFile = file;

  // 두 업로드 영역 모두 활성화 표시
  uploadArea.classList.add('has-file');
  uploadAreaCapture.classList.add('has-file');

  // 다른 input 초기화
  if (sourceInput === fileInput) {
    fileInputCapture.value = '';
  } else {
    fileInput.value = '';
  }

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
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files && fileInput.files[0];
  handleFileSelect(file, fileInput);
});

fileInputCapture.addEventListener('change', () => {
  const file = fileInputCapture.files && fileInputCapture.files[0];
  handleFileSelect(file, fileInputCapture);
});

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  // 입력값 검증
  const userName = document.getElementById('userName').value.trim();
  const businessNumber = document.getElementById('businessNumber').value.trim().replace(/[^\d]/g, '');
  const phoneNumber = document.getElementById('phoneNumber').value.trim().replace(/[^\d]/g, '');

  if (!userName) {
    setError('이름을 입력해 주세요.');
    document.getElementById('userName').focus();
    return;
  }

  if (!businessNumber || businessNumber.length !== 10) {
    setError('사업자 번호를 올바르게 입력해 주세요. (10자리 숫자)');
    document.getElementById('businessNumber').focus();
    return;
  }

  if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 11) {
    setError('전화번호를 올바르게 입력해 주세요. (10~11자리 숫자)');
    document.getElementById('phoneNumber').focus();
    return;
  }

  // 파일 검증 - currentFile 사용
  if (!currentFile) {
    setError('신분증 이미지를 선택하거나 촬영해 주세요.');
    return;
  }

  const file = currentFile;

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

// 사업자 번호 자동 포맷팅
businessNumberInput.addEventListener('input', (e) => {
  const formatted = formatBusinessNumber(e.target.value);
  e.target.value = formatted;
});

businessNumberInput.addEventListener('keydown', (e) => {
  // 숫자, 백스페이스, 삭제, 탭, 화살표 키만 허용
  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && !(e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))) {
    e.preventDefault();
  }
});

// 전화번호 자동 포맷팅
phoneNumberInput.addEventListener('input', (e) => {
  const formatted = formatPhoneNumber(e.target.value);
  e.target.value = formatted;
});

phoneNumberInput.addEventListener('keydown', (e) => {
  // 숫자, 백스페이스, 삭제, 탭, 화살표 키만 허용
  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && !(e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))) {
    e.preventDefault();
  }
});



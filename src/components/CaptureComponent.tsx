"use client";

import React, { useRef, useState, MouseEvent } from 'react';

export default function CaptureComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // License state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseError, setLicenseError] = useState('');
  const [validating, setValidating] = useState(false);
  const [userName, setUserName] = useState('');

  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  const validateLicense = async () => {
    if (!licenseKey.trim()) return;
    setValidating(true);
    setLicenseError('');
    try {
      const res = await fetch('/api/license/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: licenseKey.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setIsAuthorized(true);
        setUserName(data.userName);
      } else {
        setLicenseError(data.reason || '유효하지 않은 라이센스 키입니다.');
      }
    } catch (e) {
      setLicenseError('서버와 연결할 수 없습니다.');
    } finally {
      setValidating(false);
    }
  };

  const startSharing = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Allow user to choose Window, Tab, or Entire Screen
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setIsCapturing(true);
      mediaStream.getVideoTracks()[0].onended = () => stopSharing();
    } catch (err) {
      setError("화면 공유를 시작할 수 없습니다. 권한을 확인해주세요.");
    }
  };

  const stopSharing = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCapturing(false);
    setSelection(null);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!isCapturing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsSelecting(true);
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setSelection(null);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isSelecting || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setCurrentPos({ x, y });
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    if (width > 5 && height > 5) setSelection({ x, y, width, height });
    else setSelection(null);
    setIsSelecting(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current || !containerRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scaleX = video.videoWidth / video.clientWidth;
    const scaleY = video.videoHeight / video.clientHeight;
    if (selection) {
      canvas.width = selection.width * scaleX;
      canvas.height = selection.height * scaleY;
      ctx.drawImage(video, selection.x * scaleX, selection.y * scaleY, selection.width * scaleX, selection.height * scaleY, 0, 0, canvas.width, canvas.height);
    } else {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
    }
    setCapturedImage(canvas.toDataURL('image/png'));
  };

  const downloadImage = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `capture_${Date.now()}.png`;
    link.click();
  };

  // License key entry screen
  if (!isAuthorized) {
    return (
      <div className="glass-card">
        <div className="password-box">
          <h2 style={{ marginBottom: '0.5rem' }}>🔑 라이센스 키 인증</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>관리자로부터 받은 라이센스 키를 입력해주세요.</p>
          <input
            type="text"
            className="password-input"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && validateLicense()}
            style={{ letterSpacing: '0.1em', fontFamily: 'monospace' }}
          />
          {licenseError && <p style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.9rem' }}>{licenseError}</p>}
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={validateLicense} disabled={validating}>
            {validating ? '확인 중...' : '인증하기'}
          </button>
        </div>
      </div>
    );
  }

  // Main capture UI
  return (
    <>
      <div className="glass-card">
        <p style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          👤 {userName} 님으로 접속 중
        </p>
        <div className="button-group">
          {!isCapturing ? (
            <button className="btn btn-primary" onClick={startSharing}>
              <span>📷</span> 화면 선택 및 시작
            </button>
          ) : (
            <>
              <button className="btn btn-primary" onClick={takeSnapshot}>
                <span>📸</span> {selection ? '선택 영역 캡쳐' : '전체 캡쳐'}
              </button>
              <button className="btn btn-secondary" onClick={() => setSelection(null)}>
                <span>🔄</span> 선택 해제
              </button>
              <button className="btn btn-secondary" onClick={stopSharing}>
                <span>⏹️</span> 중지
              </button>
            </>
          )}
        </div>

        {error && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

        <div
          ref={containerRef}
          className="preview-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ position: 'relative', cursor: isCapturing ? 'crosshair' : 'default' }}
        >
          <video ref={videoRef} autoPlay playsInline muted />
          {isCapturing && (
            <div className="selection-overlay">
              {(isSelecting || selection) && (
                <div className="selection-box" style={{
                  left: isSelecting ? Math.min(startPos.x, currentPos.x) : selection?.x,
                  top: isSelecting ? Math.min(startPos.y, currentPos.y) : selection?.y,
                  width: isSelecting ? Math.abs(currentPos.x - startPos.x) : selection?.width,
                  height: isSelecting ? Math.abs(currentPos.y - startPos.y) : selection?.height,
                }} />
              )}
            </div>
          )}
        </div>

        <p className="subtitle" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
          {isCapturing ? '💡 마우스로 드래그하여 캡쳐할 영역을 선택할 수 있습니다.' : '화면 공유를 시작하면 영역 선택이 가능합니다.'}
        </p>
        <canvas ref={canvasRef} className="canvas-preview" />
      </div>

      {capturedImage && (
        <div className="glass-card">
          <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>캡쳐된 이미지</h2>
          <img src={capturedImage} alt="Captured" className="screenshot-preview" />
          <div className="button-group" style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={downloadImage}><span>💾</span> 저장하기 (PNG)</button>
            <button className="btn btn-secondary" onClick={() => setCapturedImage(null)}><span>🗑️</span> 삭제</button>
          </div>
        </div>
      )}

      <div className="drm-tips">
        <h3><span>ℹ️</span> 보안 프로그램(DRM) 관련 안내</h3>
        <p>엑셀이나 업무 시스템이 <strong>까맣게 나오는 경우</strong>, 아래 고급 설정을 시도해보세요:</p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
          <li><strong>하드웨어 가속 끄기</strong>: 브라우저(크롬/엣지) 설정에서 '시스템 &gt; 가능한 경우 하드웨어 가속 사용'을 끕니다.</li>
          <li><strong>공유 모드 변경</strong>: '창(Window)' 공유가 차단된다면, <strong>'전체 화면(Entire Screen)'</strong> 공유를 선택해 보세요.</li>
          <li><strong>엑셀 자체 가속 끄기</strong>: 엑셀 옵션 &gt; 고급 &gt; 표시 &gt; '하드웨어 그래픽 가속 사용 안 함'을 체크합니다.</li>
          <li><strong>웹 버전 사용</strong>: 프로그램 대신 <strong>Excel Web (office.com)</strong>으로 파일을 열어 브라우저 탭으로 캡처해 보세요.</li>
          <li><strong>컴퓨터 재부팅</strong>: 보안 소프트웨어는 설정 변경 후 재부팅이 필요한 경우가 많습니다.</li>
        </ul>
      </div>
    </>
  );
}

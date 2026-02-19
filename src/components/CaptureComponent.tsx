"use client";

import React, { useRef, useState, useEffect, MouseEvent } from 'react';

export default function CaptureComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  const startSharing = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window',
        } as any,
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCapturing(true);

      mediaStream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };
    } catch (err) {
      console.error("Error starting screen share:", err);
      setError("화면 공유를 시작할 수 없습니다. 권한을 확인해주세요.");
    }
  };

  const stopSharing = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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

    if (width > 5 && height > 5) {
      setSelection({ x, y, width, height });
    } else {
      setSelection(null);
    }

    setIsSelecting(false);
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current && containerRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Calculate ratios between displayed video and actual video resolution
      const displayWidth = video.clientWidth;
      const displayHeight = video.clientHeight;
      const actualWidth = video.videoWidth;
      const actualHeight = video.videoHeight;

      const scaleX = actualWidth / displayWidth;
      const scaleY = actualHeight / displayHeight;

      if (selection) {
        // Capture specific region
        canvas.width = selection.width * scaleX;
        canvas.height = selection.height * scaleY;

        ctx.drawImage(
          video,
          selection.x * scaleX, selection.y * scaleY, selection.width * scaleX, selection.height * scaleY,
          0, 0, canvas.width, canvas.height
        );
      } else {
        // Capture full frame
        canvas.width = actualWidth;
        canvas.height = actualHeight;
        ctx.drawImage(video, 0, 0, actualWidth, actualHeight);
      }

      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);
    }
  };

  const downloadImage = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `capture_${new Date().getTime()}.png`;
      link.click();
    }
  };

  return (
    <>
      <div className="glass-card">
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
              <button className="btn btn-secondary" onClick={() => { setSelection(null); }}>
                <span>🔄</span> 선택 해제
              </button>
              <button className="btn btn-secondary" onClick={stopSharing}>
                <span>⏹️</span> 중지
              </button>
            </>
          )}
        </div>

        {error && <p style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

        <div
          ref={containerRef}
          className="preview-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ position: 'relative' }}
        >
          <video ref={videoRef} autoPlay playsInline muted />

          {isCapturing && (
            <div className="selection-overlay">
              {(isSelecting || selection) && (
                <div
                  className="selection-box"
                  style={{
                    left: isSelecting ? Math.min(startPos.x, currentPos.x) : selection?.x,
                    top: isSelecting ? Math.min(startPos.y, currentPos.y) : selection?.y,
                    width: isSelecting ? Math.abs(currentPos.x - startPos.x) : selection?.width,
                    height: isSelecting ? Math.abs(currentPos.y - startPos.y) : selection?.height,
                  }}
                />
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
            <button className="btn btn-primary" onClick={downloadImage}>
              <span>💾</span> 저장하기 (PNG)
            </button>
            <button className="btn btn-secondary" onClick={() => setCapturedImage(null)}>
              <span>🗑️</span> 삭제
            </button>
          </div>
        </div>
      )}

      <div className="drm-tips">
        <h3><span>ℹ️</span> 보안 프로그램(DRM) 관련 안내</h3>
        <p>엑셀이나 업무 시스템이 <strong>까맣게 나오는 경우</strong>, 아래 설정을 시도해보세요:</p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
          <li>브라우저(Chrome/Edge) 설정에서 <strong>'가능한 경우 하드웨어 가속 사용'</strong>을 끕니다.</li>
          <li>전체 화면 캡쳐보다는 <strong>'창(Window)'</strong> 공유 모드를 선택하세요.</li>
          <li>이 앱은 Vercel에 배포하여 보안 네트워크 외부에서 접속하면 더 잘 작동할 수 있습니다.</li>
        </ul>
      </div>
    </>
  );
}

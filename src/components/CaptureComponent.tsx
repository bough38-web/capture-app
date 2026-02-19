"use client";

import React, { useRef, useState, useEffect } from 'react';

export default function CaptureComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

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

      // Handle stream end (user clicks "Stop Sharing")
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
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
      }
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
                <span>📸</span> 캡쳐하기
              </button>
              <button className="btn btn-secondary" onClick={stopSharing}>
                <span>⏹️</span> 중지
              </button>
            </>
          )}
        </div>

        {error && <p style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

        <div className="preview-container">
          <video ref={videoRef} autoPlay playsInline muted />
        </div>

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

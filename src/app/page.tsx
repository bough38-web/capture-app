import CaptureComponent from '@/components/CaptureComponent';

export default function Home() {
  return (
    <main className="main-container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1>NextCap Premium</h1>
        <p className="subtitle">보안 DRM을 우회하는 스마트 웹 캡쳐 솔루션</p>
      </header>

      <CaptureComponent />

      <footer className="footer">
        <p>© 2026 NextCap Labs. Designed for Security & Productivity.</p>
      </footer>
    </main>
  );
}

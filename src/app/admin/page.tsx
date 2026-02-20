"use client";

import { useState, useEffect } from 'react';

interface License {
    id: string;
    key: string;
    userName: string;
    email: string;
    isActive: boolean;
    expiresAt: { _seconds: number } | null;
    createdAt: { _seconds: number };
}

export default function AdminPage() {
    const [adminPassword, setAdminPassword] = useState('');
    const [isAdminAuthed, setIsAdminAuthed] = useState(false);
    const [authError, setAuthError] = useState(false);
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ userName: '', email: '', expiresAt: '' });
    const [createdKey, setCreatedKey] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchLicenses = async (password: string) => {
        setLoading(true);
        const res = await fetch('/api/admin/licenses', {
            headers: { 'x-admin-password': password },
        });
        if (res.ok) {
            const data = await res.json();
            setLicenses(data);
        }
        setLoading(false);
    };

    const handleAdminLogin = () => {
        fetchLicenses(adminPassword).then(() => {
            setIsAdminAuthed(true);
            setAuthError(false);
        }).catch(() => setAuthError(true));
    };

    const toggleActive = async (license: License) => {
        await fetch(`/api/admin/licenses/${license.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
            body: JSON.stringify({ isActive: !license.isActive }),
        });
        fetchLicenses(adminPassword);
    };

    const deleteLicense = async (id: string) => {
        if (!confirm('정말로 이 라이센스를 삭제하시겠습니까?')) return;
        await fetch(`/api/admin/licenses/${id}`, {
            method: 'DELETE',
            headers: { 'x-admin-password': adminPassword },
        });
        fetchLicenses(adminPassword);
    };

    const createLicense = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/licenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setCreatedKey(data.key);
                setFormData({ userName: '', email: '', expiresAt: '' });
                fetchLicenses(adminPassword);
            } else {
                alert(`라이센스 발급 실패: ${data.error || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('Error creating license:', error);
            alert('서버와 통신 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (ts: { _seconds: number } | null) => {
        if (!ts) return '무제한';
        return new Date(ts._seconds * 1000).toLocaleDateString('ko-KR');
    };

    if (!isAdminAuthed) {
        return (
            <main className="main-container">
                <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1>관리자 대시보드</h1>
                    <p className="subtitle">NextCap Premium 라이센스 관리</p>
                </header>
                <div className="glass-card" style={{ maxWidth: 400 }}>
                    <div className="password-box">
                        <h2>🔐 관리자 로그인</h2>
                        <input
                            type="password"
                            className="password-input"
                            placeholder="관리자 비밀번호"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                        />
                        {authError && <p style={{ color: '#ef4444' }}>비밀번호가 올바르지 않습니다.</p>}
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAdminLogin}>
                            로그인
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="main-container">
            <header style={{ textAlign: 'center', marginBottom: '2rem', width: '100%', maxWidth: 1000 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>관리자 대시보드</h1>
                        <p className="subtitle" style={{ marginBottom: 0 }}>NextCap Premium 라이센스 관리</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setShowModal(true); setCreatedKey(''); }}>
                        ➕ 새 라이센스 발급
                    </button>
                </div>
            </header>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ maxWidth: 420, width: '90%' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>새 라이센스 발급</h2>
                        {createdKey ? (
                            <>
                                <p style={{ color: '#10b981', marginBottom: '1rem' }}>✅ 라이센스가 성공적으로 발급되었습니다!</p>
                                <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid #6366f1', borderRadius: 12, padding: '1rem', textAlign: 'center', fontSize: '1.2rem', fontFamily: 'monospace', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                                    {createdKey}
                                </div>
                                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => copyToClipboard(createdKey, 'modal')}>
                                    {copiedId === 'modal' ? '✅ 복사됨!' : '📋 라이센스 키 복사'}
                                </button>
                                <button className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setShowModal(false)}>
                                    닫기
                                </button>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <input className="password-input" style={{ textAlign: 'left', fontSize: '1rem' }} placeholder="사용자 이름" value={formData.userName} onChange={e => setFormData(p => ({ ...p, userName: e.target.value }))} />
                                    <input className="password-input" style={{ textAlign: 'left', fontSize: '1rem' }} placeholder="이메일 주소" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>만료일 (비워두면 무제한)</label>
                                        <input className="password-input" style={{ textAlign: 'left', fontSize: '1rem', marginTop: '0.3rem' }} type="date" value={formData.expiresAt} onChange={e => setFormData(p => ({ ...p, expiresAt: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="button-group" style={{ marginTop: '1.5rem' }}>
                                    <button className="btn btn-primary" onClick={createLicense}>발급하기</button>
                                    <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* License Table */}
            <div className="glass-card" style={{ maxWidth: 1000, overflowX: 'auto' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>로딩 중...</p>
                ) : licenses.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>발급된 라이센스가 없습니다.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>사용자</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>이메일</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>라이센스 키</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>상태</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>만료일</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {licenses.map(lic => (
                                <tr key={lic.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.75rem' }}>{lic.userName}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{lic.email}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(99,102,241,0.1)', padding: '0.2rem 0.5rem', borderRadius: 6, cursor: 'pointer' }} onClick={() => copyToClipboard(lic.key, lic.id)}>
                                            {copiedId === lic.id ? '✅ 복사됨' : lic.key}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <span style={{ color: lic.isActive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                            {lic.isActive ? '✅ 활성' : '🚫 비활성'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        {formatDate(lic.expiresAt)}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => toggleActive(lic)}>
                                                {lic.isActive ? '비활성화' : '활성화'}
                                            </button>
                                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => deleteLicense(lic.id)}>
                                                삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </main>
    );
}

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Loader } from 'lucide-react';
import Button from '../ui/Button';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef(null);
    const html5QrCode = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [scanError, setScanError] = useState(null);

    useEffect(() => {
        // Delay initialization slightly to ensure the DOM element is ready
        const timer = setTimeout(() => {
            if (!scannerRef.current) return;

            html5QrCode.current = new Html5Qrcode("reader");

            const config = { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 };

            html5QrCode.current.start(
                { facingMode: "environment" },
                config,
                (decodedText, decodedResult) => {
                    // Stop scanning on first successful read
                    if (html5QrCode.current && html5QrCode.current.isScanning) {
                        html5QrCode.current.stop().then(() => {
                            onScanSuccess(decodedText);
                        }).catch(err => console.error("Error stopping scanner", err));
                    }
                },
                (errorMessage) => {
                    // console.warn("QR Error", errorMessage); // Very noisy, ignore
                }
            ).then(() => {
                setIsLoading(false);
            }).catch((err) => {
                console.error("Failed to start scanner", err);
                setIsLoading(false);
                setScanError("Impossibile accedere alla fotocamera. Verifica i permessi.");
            });
        }, 100);

        return () => {
            clearTimeout(timer);
            if (html5QrCode.current && html5QrCode.current.isScanning) {
                html5QrCode.current.stop().catch(err => console.error("Error unmounting scanner", err));
            }
        };
    }, [onScanSuccess]);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--bg-dark)', zIndex: 100000,
            display: 'flex', flexDirection: 'column',
            animation: 'fadeInUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'linear-gradient(180deg, rgba(20,20,25,0.95) 0%, rgba(20,20,25,0) 100%)',
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2
            }}>
                <div>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>Scannerizza Prodotto</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Inquadra il codice a barre</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <X size={20} color="#fff" />
                </Button>
            </div>

            {/* Scanner Viewport */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                {isLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--accent-gold)' }}>
                        <Loader className="animate-spin" size={32} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Avvio fotocamera...</span>
                    </div>
                )}
                {scanError && (
                    <div style={{ background: 'rgba(239,68,68,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.4)', textAlign: 'center', margin: '20px' }}>
                        <p style={{ color: '#FCA5A5', fontSize: '0.9rem' }}>{scanError}</p>
                    </div>
                )}

                {/* Scanner Target Div */}
                <div id="reader" ref={scannerRef} style={{ width: '100%', maxWidth: '500px', opacity: isLoading || scanError ? 0 : 1 }}></div>
            </div>

            {/* Overlay Frame */}
            {!isLoading && !scanError && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '65%', height: '150px', border: '2px solid var(--accent-gold)', borderRadius: '16px',
                    boxShadow: '0 0 0 4000px rgba(0,0,0,0.6)', pointerEvents: 'none', zIndex: 1
                }} />
            )}
        </div>
    );
};

export default BarcodeScanner;

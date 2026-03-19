import React from 'react';

const CsvCoin = ({ size = 20 }) => (
    <div style={{
        width: size,
        height: size,
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
        position: 'relative',
        // 3D thickness with heavy dopamine glow (Warm White Peach)
        filter: 'drop-shadow(0px 1px 0px #CC9966) drop-shadow(0px 2px 0px #AA7744) drop-shadow(0 0 12px rgba(255,215,170,0.8)) drop-shadow(0 0 24px rgba(255,215,170,0.4))',
        transform: 'translateZ(0)' // Hardware acceleration
    }}>
        {/* Base Warm-White Layer */}
        <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5E6 40%, #Eebb88 100%)',
            WebkitMaskImage: 'url(/images/csv-logo.png)',
            WebkitMaskSize: 'contain',
            WebkitMaskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskImage: 'url(/images/csv-logo.png)',
            maskSize: 'contain',
            maskPosition: 'center',
            maskRepeat: 'no-repeat',
        }} />
        {/* Metallic Highlight / Bevel Overlay */}
        <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.6) 100%)',
            WebkitMaskImage: 'url(/images/csv-logo.png)',
            WebkitMaskSize: 'contain',
            WebkitMaskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskImage: 'url(/images/csv-logo.png)',
            maskSize: 'contain',
            maskPosition: 'center',
            maskRepeat: 'no-repeat',
            mixBlendMode: 'overlay'
        }} />
    </div>
);

export default CsvCoin;

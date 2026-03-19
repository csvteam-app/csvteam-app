import React from 'react';
import './Button.css';

const Button = ({
    children,
    variant = 'primary', // primary, secondary, outline, ghost
    size = 'md', // sm, md, lg, icon
    fullWidth = false,
    className = '',
    onClick,
    disabled = false,
    ...props
}) => {
    const classes = [
        'csv-btn',
        `csv-btn-${variant}`,
        `csv-btn-${size}`,
        fullWidth ? 'csv-btn-full' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;

import React from 'react';
import './Button.css';

const Button = ({
    children,
    variant = 'primary', // primary, secondary, outline, ghost
    size = 'md', // sm, md, lg, icon
    fullWidth = false,
    loading = false,
    className = '',
    onClick,
    disabled = false,
    ...props
}) => {
    const isDisabled = disabled || loading;

    const classes = [
        'csv-btn',
        `csv-btn-${variant}`,
        `csv-btn-${size}`,
        fullWidth ? 'csv-btn-full' : '',
        loading ? 'csv-btn-loading' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            onClick={isDisabled ? undefined : onClick}
            disabled={isDisabled}
            {...props}
        >
            {loading ? (
                <span className="csv-btn-spinner" />
            ) : (
                children
            )}
        </button>
    );
};

export default Button;

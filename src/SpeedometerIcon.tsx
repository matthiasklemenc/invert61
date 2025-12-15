import React from 'react';

type Props = {
    className?: string;
    style?: React.CSSProperties;
};

export default function SpeedometerIcon({ className = 'w-6 h-6', style }: Props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
            <path d="M12 2C6.486 2 2 6.486 2 12h2c0-4.411 3.589-8 8-8s8 3.589 8 8h2c0-5.514-4.486-10-10-10zM5.5 11a.5.5 0 0 1 0-1h-2a.5.5 0 0 1 0 1h2zm13 0a.5.5 0 0 1 0-1h2a.5.5 0 0 1 0 1h-2zm-10.7-.7a.5.5 0 1 1 .7.7L7 9.5a.5.5 0 0 1-.7-.7zm9.1 0a.5.5 0 0 1 .7.7L16 9.5a.5.5 0 1 1-.7-.7z" />
            <path d="M12 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3.54-5.54L10.95 14a.5.5 0 0 1-.7-.7l4.59-4.59a.5.5 0 1 1 .7.7z" />
        </svg>
    );
}

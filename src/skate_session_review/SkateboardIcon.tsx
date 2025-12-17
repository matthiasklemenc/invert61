import React from 'react';

type Props = {
    className?: string;
    style?: React.CSSProperties;
};

// Fix: Using React.FC<Props> ensures standard React props like 'key' are correctly recognized when the component is used in a list.
const SkateboardIcon: React.FC<Props> = ({ className = 'w-6 h-6', style }) => {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className={className} 
            style={style}
        >
            <path d="M19 13H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2zM7 15a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm10 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
        </svg>
    );
};

export default SkateboardIcon;
import React from 'react';

type Props = { className?: string; title?: string };

const GrainIcon: React.FC<Props> = ({ className = 'w-6 h-6', title = 'Adjustments' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : 'presentation'}
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    {title ? <title>{title}</title> : null}
    {/* Cog / Gear */}
    <path d="M11 2h2l.5 2.2a7.9 7.9 0 0 1 1.6.7l2-1.1 1.4 1.4-1.1 2c.26.5.5 1.04.7 1.6L20 11v2l-2.2.5c-.2.56-.44 1.1-.7 1.6l1.1 2-1.4 1.4-2-1.1c-.52.28-1.06.52-1.6.7L13 22h-2l-.5-2.2a7.9 7.9 0 0 1-1.6-.7l-2 1.1-1.4-1.4 1.1-2a7.9 7.9 0 0 1-.7-1.6L2 13v-2l2.2-.5c.18-.56.42-1.1.7-1.6l-1.1-2L5.2 5l2 1.1c.52-.28 1.06-.52 1.6-.7L11 2zm1 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
  </svg>
);

export default GrainIcon;
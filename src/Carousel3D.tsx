
import React from 'react';

export type CarouselItem = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type Props = {
  items: CarouselItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const Carousel3D: React.FC<Props> = ({ items, selectedIndex, onSelect }) => {
  
  const moveToSelected = (direction: "prev" | "next") => {
    if (direction === "next") {
      onSelect((selectedIndex + 1) % items.length);
    } else if (direction === "prev") {
      onSelect(selectedIndex === 0 ? items.length - 1 : selectedIndex - 1);
    }
  };

  const getClassName = (index: number) => {
    const len = items.length;
    const relativeIndex = (index - selectedIndex + len) % len;
    
    if (relativeIndex === 0) return "c3d-item selected";
    if (relativeIndex === 1) return "c3d-item next";
    if (relativeIndex === 2) return "c3d-item nextRightSecond";
    if (relativeIndex === len - 1) return "c3d-item prev";
    if (relativeIndex === len - 2) return "c3d-item prevLeftSecond";
    
    return relativeIndex > 2 ? "c3d-item hideRight" : "c3d-item hideLeft";
  };

  return (
    <div id="carousel-area" className="c3d-area">
      <div id="carousel" className="c3d-carousel">
        {items.map((item, index) => (
          <div 
            className={getClassName(index)} 
            key={item.id}
            onClick={() => onSelect(index)}
          >
            <div className="c3d-img-wrap">
              <div className="c3d-content-inner">
                {item.content}
              </div>
              <span className="c3d-text">{item.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="c3d-buttons">
        <button className="c3d-icon-btn" onClick={(e) => { e.stopPropagation(); moveToSelected("prev"); }}>
           <svg xmlns="http://www.w3.org/2000/svg" className="c3d-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
           </svg>
        </button>
        <button className="c3d-icon-btn" onClick={(e) => { e.stopPropagation(); moveToSelected("next"); }}>
           <svg xmlns="http://www.w3.org/2000/svg" className="c3d-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
           </svg>
        </button>
      </div>
    </div>
  );
};

export default Carousel3D;

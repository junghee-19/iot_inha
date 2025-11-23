import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    width="56"
    height="24"
    viewBox="0 0 56 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke="currentColor"
      strokeWidth="2.5"
    />
    <path
      d="M34 22C39.5228 22 44 17.5228 44 12C44 6.47715 39.5228 2 34 2C28.4772 2 24 6.47715 24 12C24 17.5228 28.4772 22 34 22Z"
      stroke="currentColor"
      strokeWidth="2.5"
    />
    <path
      d="M21 12C23.0833 15.5833 26.9167 15.5833 29 12"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SparkleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
    {...props}
    viewBox="0 0 60 60" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    >
        <path d="M30 0L36.7368 23.2632L60 30L36.7368 36.7368L30 60L23.2632 36.7368L0 30L23.2632 23.2632L30 0Z" fill="#374151"/>
    </svg>
);
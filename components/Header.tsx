import React from 'react';
import logo from '../public/assets/logo.png';

const Header: React.FC = () => {
  return (
    <header className="flex flex-col items-center justify-center pt-6 pb-10 text-center">
      <img
        src={logo}
        alt="Inha Technical College Logo"
        className="h-20 w-auto mb-3"
        loading="lazy"
      />
      <h1 className="text-4xl font-semibold tracking-tight text-gray-900">인하공업전문대학</h1>
      <p className="text-base text-gray-500 mt-1 tracking-wide">캠퍼스 안내</p>
    </header>
  );
};

export default Header;

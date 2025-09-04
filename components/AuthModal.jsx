import { SignIn, SignUp } from '@clerk/nextjs';
import { useState } from 'react';

const AuthModal = ({ isOpen, onClose, mode = 'sign-in' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        {mode === 'sign-in' ? (
          <SignIn path="/sign-in" routing="path" />
        ) : (
          <SignUp path="/sign-up" routing="path" />
        )}
      </div>
    </div>
  );
};

export default AuthModal;

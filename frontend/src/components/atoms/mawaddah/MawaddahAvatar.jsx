import React, { useRef } from 'react';

// Utility to resolve avatar URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://mawaddahapp.up.railway.app';
function getAvatarUrl(avatar) {
  if (!avatar) return null;
  if (typeof avatar !== 'string') return avatar;
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  return `${BACKEND_URL}${avatar}`;
}

export default function MawaddahAvatar({ value, onChange, onClear, size = 112, disabled = false }) {
  const inputRef = useRef();
  const isImage = value && typeof value === 'string';
  const previewUrl = isImage ? getAvatarUrl(value) : value ? URL.createObjectURL(value) : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`rounded-full border-4 border-primary bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden`}
        style={{ width: size, height: size }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Avatar"
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-4xl text-gray-400">🧑</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            onChange(e.target.files[0]);
          }
        }}
      />
      <button
        type="button"
        className="mt-2 px-3 py-1 rounded bg-primary text-white font-medium text-sm disabled:opacity-60"
        onClick={() => inputRef.current && inputRef.current.click()}
        disabled={disabled}
      >
        Change Avatar
      </button>
      {value && (
        <button
          type="button"
          className="text-xs text-gray-500 dark:text-gray-400 underline mt-1"
          onClick={onClear}
          disabled={disabled}
        >
          Clear
        </button>
      )}
    </div>
  );
} 
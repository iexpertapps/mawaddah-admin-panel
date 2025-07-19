import React from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onClose, title, description, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded p-6 shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold">{title}</h2>
        {description && <p className="text-gray-500 dark:text-zinc-400">{description}</p>}
        <div className="mt-4">{children}</div>
        <button onClick={onClose} className="mt-6 text-sm text-blue-600 underline">
          Close
        </button>
      </div>
    </div>
  );
};

export default Dialog; 
import React from 'react';
import { Camera } from 'lucide-react';

interface ProfileImageUploaderProps {
  photoUrl: string;
  fullName: string;
  onUpload: (file: File) => void;
}

const DEFAULT_PROFILE_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/jaffna-hindu-college.appspot.com/o/logo.png?alt=media&token=YOUR_TOKEN_HERE'; // Replace with actual URL

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({ photoUrl, fullName, onUpload }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="relative w-24 h-24 group">
      <img
        src={photoUrl || DEFAULT_PROFILE_IMAGE}
        alt={fullName}
        className="w-full h-full object-cover rounded-2xl border border-slate-200"
      />
      <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
        <Camera className="text-white" size={24} />
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </label>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, User, Phone, MapPin, Briefcase, Calendar, ShieldCheck, Mail } from 'lucide-react';

export const EditProfile = () => {
  const { user, employee, setUser, setEmployee } = useAuth();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    user?.profile_image 
      ? (user.profile_image.startsWith('http') ? user.profile_image : `http://${window.location.hostname}:8000${user.profile_image}`) 
      : employee?.user_profile_image 
      ? (employee.user_profile_image.startsWith('http') ? employee.user_profile_image : `http://${window.location.hostname}:8000${employee.user_profile_image}`) 
      : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      first_name: user?.first_name || user?.full_name?.split(' ')[0] || '',
      last_name: user?.last_name || user?.full_name?.split(' ').slice(1).join(' ') || '',
      phone_number: employee?.contact_number || user?.phone || '',
      address: user?.address || employee?.office_location || '',
      job_title: employee?.designation_name || user?.designation || '',
      gender: employee?.gender || user?.gender || '',
      date_of_birth: employee?.date_of_birth || '',
      joining_date: user?.joining_date || ''
    }
  });

  const initials = (user?.full_name || 'System Associate')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setError('');
      
      const formData = new FormData();
      formData.append('first_name', data.first_name);
      formData.append('last_name', data.last_name);
      formData.append('phone_number', data.phone_number);
      formData.append('address', data.address);
      formData.append('job_title', data.job_title);
      formData.append('gender', data.gender);
      formData.append('date_of_birth', data.date_of_birth);
      formData.append('joining_date', data.joining_date);
      
      if (profileImage) {
        formData.append('profile_image', profileImage);
      }

      const response = await api.patch('/accounts/users/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUser(response.data.user);
      setEmployee(response.data.employee);
      navigate('/profile');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans pb-16">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-[2.5rem] shadow-sm border border-surface-100 overflow-hidden"
      >
        {/* Sleek form header with gradient top border */}
        <div className="px-8 py-7 border-b border-surface-50 flex justify-between items-center bg-surface-50/50 backdrop-blur-sm relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-700 to-blue-600"></div>
          <div>
            <h2 className="text-xl font-black text-surface-900 tracking-tight flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#6345ED]" /> Configure Personal Identity Passport
            </h2>
            <p className="text-[11px] font-semibold text-surface-400 mt-1 uppercase tracking-widest">Update secure credentials & profile attributes</p>
          </div>
          <button 
            type="button"
            onClick={() => navigate('/profile')}
            className="text-xs font-bold text-surface-400 hover:text-surface-900 transition-colors uppercase tracking-widest"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold animate-pulse">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-10">
            
            {/* Left Column: Photo Uploader Card */}
            <div className="flex flex-col items-center shrink-0">
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-4">Profile Photo</p>
              
              <div className="relative group mb-4">
                <div className="w-36 h-36 rounded-[2.2rem] overflow-hidden border-4 border-white bg-gradient-to-tr from-violet-500 to-blue-500 shadow-md relative flex items-center justify-center text-white text-3xl font-black tracking-wider transition-all duration-300 group-hover:scale-101 shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                  {/* Photo Overlay hover trigger */}
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                  >
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/*"
              />
              
              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()}
                className="text-xs font-black text-violet-600 hover:text-violet-800 transition-colors uppercase tracking-widest mt-1.5"
              >
                Upload New Image
              </button>
            </div>

            {/* Right Column: Editable Vector Fields */}
            <div className="flex-1 space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* First Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest">First Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-450" size={16} />
                    <input type="text" {...register("first_name")} className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-400 focus:bg-white transition-all shadow-inner" />
                  </div>
                </div>

                {/* Last Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-450" size={16} />
                    <input type="text" {...register("last_name")} className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-400 focus:bg-white transition-all shadow-inner" />
                  </div>
                </div>
              </div>

              {/* Job Title (Disabled/HR managed) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Job Designation</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 animate-pulse" size={16} />
                  <input type="text" {...register("job_title")} disabled className="w-full pl-11 pr-4 py-3 bg-slate-100/50 border border-surface-200 rounded-2xl text-xs text-slate-400 font-semibold cursor-not-allowed shadow-inner" />
                </div>
                <p className="text-[9px] text-surface-400 font-bold uppercase tracking-wider pl-1.5">Designations are strictly managed by HR Administration</p>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Contact Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-450" size={16} />
                  <input type="tel" {...register("phone_number")} className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-400 focus:bg-white transition-all shadow-inner" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Gender</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-450" size={16} />
                    <select {...register("gender")} className="w-full pl-11 pr-10 py-3 bg-surface-50 border border-surface-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-400 focus:bg-white transition-all shadow-inner appearance-none">
                      <option value="">Select Gender...</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-450" size={16} />
                    <input type="date" {...register("date_of_birth")} className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-400 focus:bg-white transition-all shadow-inner" />
                  </div>
                </div>
              </div>

              {/* Home Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Home Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 text-surface-450" size={16} />
                  <textarea {...register("address")} rows="3" className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-violet-400 focus:bg-white transition-all shadow-inner resize-none"></textarea>
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3.5">
                <button 
                  type="button" 
                  onClick={() => navigate('/profile')}
                  className="px-5 py-3 border border-surface-200 hover:bg-surface-50 text-surface-700 text-xs font-bold rounded-2xl shadow-sm transition-all"
                >
                  Cancel
                </button>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-black rounded-2xl shadow-md transition-all disabled:opacity-75"
                >
                  {isSubmitting ? 'Syncing...' : 'Save Credentials'}
                </button>
              </div>
            </div>
            
          </div>
        </form>
      </motion.div>
    </div>
  );
};

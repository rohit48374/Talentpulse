import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/accounts/users/me/');
          setUser(response.data.user);
          setEmployee(response.data.employee);
        } catch (error) {
          console.error("Failed to fetch user:", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/accounts/users/login/', { email, password });
    const { access, user: loggedUser } = response.data;
    localStorage.setItem('token', access);
    
    try {
      const meResponse = await api.get('/accounts/users/me/', {
        headers: { Authorization: `Bearer ${access}` }
      });
      setUser(meResponse.data.user);
      setEmployee(meResponse.data.employee);
    } catch (e) {
      setUser(loggedUser);
      setEmployee(null);
    }
  };

  const register = async (userData) => {
    let payload = {};
    if (userData instanceof FormData) {
      // Map form data fields cleanly to match the backend expectation
      payload = {
        email: userData.get('email'),
        employee_id: userData.get('employee_id'),
        password: userData.get('password'),
        password_confirm: userData.get('password') || userData.get('password_confirm'),
        full_name: `${userData.get('first_name') || ''} ${userData.get('last_name') || ''}`.trim(),
        first_name: userData.get('first_name') || '',
        last_name: userData.get('last_name') || '',
        phone: userData.get('phone_number') || userData.get('phone') || '',
        department: userData.get('department') || '',
        role: userData.get('role') || 'employee'
      };
    } else {
      payload = {
        email: userData.email,
        employee_id: userData.employee_id,
        password: userData.password,
        password_confirm: userData.password_confirm || userData.password,
        full_name: userData.full_name || `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim(),
        first_name: userData.first_name || userData.firstName || '',
        last_name: userData.last_name || userData.lastName || '',
        phone: userData.phone || userData.phone_number || '',
        department: userData.department || '',
        role: userData.role || 'employee'
      };
    }

    await api.post('/accounts/users/register/', payload);
    await login(payload.email || payload.employee_id, payload.password);

    // If address or profile photo was provided, save them in the background post-login!
    const address = userData instanceof FormData ? userData.get('address') : userData.address;
    const profileImage = userData instanceof FormData ? userData.get('profile_image') : userData.profile_image;
    if (address || profileImage) {
      const patchData = new FormData();
      if (address) patchData.append('address', address);
      if (profileImage) patchData.append('profile_image', profileImage);
      
      try {
        const patchRes = await api.patch('/accounts/users/me/', patchData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setUser(patchRes.data.user);
        setEmployee(patchRes.data.employee);
      } catch (patchErr) {
        console.error("Failed to automatically upload photo or address post-signup", patchErr);
      }
    }
  };

  const logout = async () => {
    try {
      await api.post('/accounts/users/logout/');
    } catch (e) {
      console.warn("Logout request failed, clearing tokens anyway.");
    }
    localStorage.removeItem('token');
    setUser(null);
    setEmployee(null);
  };

  return (
    <AuthContext.Provider value={{ user, employee, login, register, logout, loading, setEmployee, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

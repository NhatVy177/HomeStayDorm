import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../pages/auth/auth.api.js';
import { clearSession, getStoredSession, getStoredToken, storeSession } from './auth.storage.js';

const AuthContext = createContext(null);

function mergeFilled(base = {}, update = {}) {
  return Object.fromEntries(
    Object.entries({ ...base, ...update }).map(([key, value]) => [
      key,
      value === undefined || value === null || value === '' ? base[key] : value
    ])
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    if (!getStoredToken()) {
      setIsLoading(false);
      return;
    }

    authApi.getToi()
      .then(({ data }) => {
        const storedUser = getStoredSession()?.user || {};
        setUser(mergeFilled(storedUser, data));
      })
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));
  }, []);

  async function dangNhap(credentials) {
    const { data } = await authApi.dangNhap(credentials);
    storeSession(data);
    setUser(data.user);
    return data.user;
  }

  async function dangKy(formData) {
    const { data } = await authApi.dangKy(formData);
    storeSession(data);
    setUser(data.user);
  }

  async function dangXuat() {
    try {
      await authApi.dangXuat();
    } finally {
      clearSession();
      setUser(null);
      if (window.location.pathname !== '/') {
        window.location.assign('/');
      }
    }
  }

  const value = useMemo(
    () => ({ user, isLoading, dangNhap, dangKy, dangXuat }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

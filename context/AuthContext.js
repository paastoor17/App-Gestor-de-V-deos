import React, { createContext, useContext, useState, useEffect } from 'react';
import { Text } from 'react-native'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      setUserId('12345'); 
    };
    fetchUserId();
  }, []);

  if (userId === null) {
    return <Text>Cargando...</Text>;
  }

  return (
    <AuthContext.Provider value={{ userId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

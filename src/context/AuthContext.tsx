import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { garantirPerfilUsuario } from '../services/usuarios';

interface UserData {
  nome: string;
  email: string;
  telefone?: string;
  dataNascimento?: string;
  avatarUrl?: string;
  preferenciasConcluidas?: boolean;
  preferencias?: Record<string, unknown>;
  requisitos?: string[];
  roteirosSalvos?: string[];
}

interface AuthContextData {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: (customUid?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string, authUser: User | null = user) => {
    if (!db) {
      setUserData(null);
      return;
    }

    try {
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        setUserData({
          ...data,
          nome: data.nome || authUser?.displayName || 'Usuário',
          email: data.email || authUser?.email || '',
        });
      } else if (authUser) {
        await garantirPerfilUsuario(authUser);
        const novoSnap = await getDoc(docRef);
        const data = novoSnap.data() as UserData | undefined;
        setUserData({
          ...data,
          nome: authUser.displayName || 'Usuário',
          email: authUser.email || '',
          preferenciasConcluidas: data?.preferenciasConcluidas ?? false,
          preferencias: data?.preferencias ?? {},
          requisitos: data?.requisitos ?? [],
          roteirosSalvos: data?.roteirosSalvos ?? [],
        });
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
    }
  };

  const refreshUserData = async (customUid?: string) => {
    const uid = customUid || user?.uid;
    if (uid) {
      await fetchUserData(uid);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchUserData(user.uid, user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import { createContext,useContext, useEffect,useState } from "react";
import AsyncStorage from  "@react-native-async-storage/async-storage";
import {router } from 'expo-router';

const AuthContext = createContext(null);

export function AuthProvider({children}){
    const [token,setToken] = useState(null);
    const [loading,setLoading] = useState(true);

    useEffect(()=>{
        const loadToken = async() =>{
            const storedToken = await AsyncStorage.getItem("token");
            if(storedToken)setToken(storedToken);
            setLoading(false);
        };
        loadToken();

        
    },[]);

    const login = async (token) => {
        await AsyncStorage.setItem("token",token);
        setToken(token);
        router.replace("/(tabs)/");

    }
    const logout = async()=>{
        await AsyncStorage.removeItem("token");
        setToken(null);
        router.replace("/(auth)/");

    }
    return(
        <AuthContext.Provider value={{token , login, logout , loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
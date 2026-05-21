import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
        <Stack.Screen name="redefinir" />
        <Stack.Screen name="verificacao" />
        <Stack.Screen name="home" />
        <Stack.Screen name="roteiros" />
        <Stack.Screen name="roteiro-detalhes" />
        <Stack.Screen name="mapa" />
        <Stack.Screen name="criar-roteiro" />
        <Stack.Screen name="detalhes-cidade" />
        <Stack.Screen name="city-details" />
        <Stack.Screen name="perfil" />
        <Stack.Screen name="perfil/meu-perfil" />
        <Stack.Screen name="perfil/editar-perfil" />
        <Stack.Screen name="perfil/preferencias" />
        <Stack.Screen name="perfil/avaliacoes" />
        <Stack.Screen name="perfil/roteiros-favoritos" />
        <Stack.Screen name="perfil/configuracoes" />
      </Stack>
    </AuthProvider>
  );
}

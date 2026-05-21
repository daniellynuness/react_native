import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Alert, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../services/firebase';
import { garantirPerfilUsuario } from '../services/usuarios';
import AuthLinkAction from '../components/auth/components/AuthLinkAction';
import AuthScreenLayout from '../components/auth/components/AuthScreenLayout';
import FormField from '../components/auth/components/FormField';
import CustomInput from '../components/ui/CustomInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import { Colors } from '../constants/Colors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CadastroScreen() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erroNome, setErroNome] = useState('');
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [erroConfirmar, setErroConfirmar] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCadastro() {
    console.log('BOTÃO CADASTRO CLICADO');

    // 1. Validacao local — se algo falhar, nao chama Firebase nem navega.
    let valido = true;
    const nomeTrim = nome.trim();
    const emailTrim = email.trim();

    if (!nomeTrim) {
      setErroNome('O nome é obrigatório.');
      valido = false;
    } else {
      setErroNome('');
    }

    if (!emailTrim) {
      setErroEmail('O e-mail é obrigatório.');
      valido = false;
    } else if (!EMAIL_REGEX.test(emailTrim)) {
      setErroEmail('Informe um e-mail válido.');
      valido = false;
    } else {
      setErroEmail('');
    }

    if (!senha) {
      setErroSenha('A senha é obrigatória.');
      valido = false;
    } else if (senha.length < 6) {
      setErroSenha('A senha deve ter no mínimo 6 caracteres.');
      valido = false;
    } else {
      setErroSenha('');
    }

    if (!confirmarSenha) {
      setErroConfirmar('Confirme a sua senha.');
      valido = false;
    } else if (confirmarSenha !== senha) {
      setErroConfirmar('As senhas não coincidem.');
      valido = false;
    } else {
      setErroConfirmar('');
    }

    if (!valido) return;

    // DEV_FALLBACK: remove after Firebase integration is complete.
    // Modo desenvolvimento: sem Firebase, simula cadastro e volta para /login.
    // Importante: no React Native Web o callback do botao do Alert nao dispara,
    // entao navegamos antes/independente do Alert.
    if (!isFirebaseConfigured || !auth || !db) {
      Alert.alert('Modo desenvolvimento', 'Cadastro simulado. Nenhuma conta real foi criada.');
      router.replace('/login');
      return;
    }

    // 3. Fluxo real do Firebase
    setLoading(true);
    let contaCriada = false;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailTrim, senha);
      const user = userCredential.user;
      contaCriada = true;
      await updateProfile(user, { displayName: nomeTrim });

      await setDoc(doc(db, 'usuarios', user.uid), {
        nome: nomeTrim,
        email: emailTrim,
        telefone: '',
        dataNascimento: '',
        avatarUrl: '',
        createdAt: new Date().toISOString(),
        preferenciasConcluidas: false,
        preferencias: {},
        requisitos: [],
        roteirosSalvos: [],
      });
      await garantirPerfilUsuario(user, { nome: nomeTrim, email: emailTrim });

      // createUserWithEmailAndPassword loga automaticamente; saimos para forcar
      // login manual e cair no onboarding de preferencias.
      await signOut(auth);
      router.replace('/login');
    } catch (error: any) {
      console.error('[cadastro]', error);
      let mensagem = 'Erro ao criar conta. Tente novamente.';

      if (contaCriada) {
        mensagem =
          'Sua conta foi criada, mas nao foi possivel salvar seu perfil. ' +
          'Verifique as Regras do Firestore (colecao "usuarios") e tente fazer login.';
        try { await signOut(auth); } catch {}
        router.replace('/login');
      } else if (error.code === 'auth/email-already-in-use') {
        mensagem = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/invalid-email') {
        mensagem = 'Informe um e-mail válido.';
      } else if (error.code === 'auth/weak-password') {
        mensagem = 'A senha precisa ter pelo menos 6 caracteres.';
      } else if (error.code === 'auth/network-request-failed') {
        mensagem = 'Falha de conexão. Verifique sua internet.';
      }

      Alert.alert('Erro', mensagem);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      title="Cadastro"
      primaryAction={
        loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <PrimaryButton title="Cadastrar" onPress={handleCadastro} />
        )
      }
      footerAction={<AuthLinkAction label="Já possui conta? Faça o Login" onPress={() => router.push('/login')} />}
    >
      <FormField error={erroNome}>
        <CustomInput
          placeholder="Nome completo"
          value={nome}
          onChangeText={setNome}
        />
      </FormField>

      <FormField error={erroEmail}>
        <CustomInput
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </FormField>

      <FormField error={erroSenha}>
        <CustomInput
          placeholder="Senha"
          secureTextEntry={!mostrarSenha}
          value={senha}
          onChangeText={setSenha}
          right={
            <Pressable onPress={() => setMostrarSenha((v) => !v)}>
              <MaterialIcons
                name={mostrarSenha ? 'visibility-off' : 'visibility'}
                size={22}
                color={Colors.textGray}
              />
            </Pressable>
          }
        />
      </FormField>

      <FormField error={erroConfirmar}>
        <CustomInput
          placeholder="Confirmar senha"
          secureTextEntry={!mostrarConfirmar}
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          right={
            <Pressable onPress={() => setMostrarConfirmar((v) => !v)}>
              <MaterialIcons
                name={mostrarConfirmar ? 'visibility-off' : 'visibility'}
                size={22}
                color={Colors.textGray}
              />
            </Pressable>
          }
        />
      </FormField>
    </AuthScreenLayout>
  );
}

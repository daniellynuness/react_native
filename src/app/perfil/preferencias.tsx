import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useResponsive } from '../../utils/responsive';
import { useAuth } from '../../context/AuthContext';
import { auth, db, isFirebaseConfigured } from '../../services/firebase';
import { salvarPerfilUsuario } from '../../services/usuarios';

const CLIMA_OPTIONS = ['Quente', 'Temperado', 'Frio', 'Qualquer'];
const DURACAO_OPTIONS = ['1 dia', '2-3 dias', '4-7 dias', '7+ dias'];
const ESTILO_OPTIONS = ['Aventura', 'Cultural', 'Gastronomia', 'Relaxamento', 'Ecoturismo'];

function montarRequisitos(preferencias: { clima: string[]; duracao: string[]; estilo: string[] }) {
  return [...preferencias.estilo, ...preferencias.duracao, ...preferencias.clima].slice(0, 6);
}

type ChipGroupProps = {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
};

function ChipGroup({ title, options, selected, onToggle }: ChipGroupProps) {
  const r = useResponsive();
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { fontSize: r.font(16) }]}>{title}</Text>
      <View style={styles.chips}>
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onToggle(opt)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, { fontSize: r.font(14) }, active && styles.chipTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function PreferenciasScreen() {
  const router = useRouter();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { user, userData, refreshUserData } = useAuth();

  const [clima, setClima] = useState<string[]>([]);
  const [duracao, setDuracao] = useState<string[]>([]);
  const [estilo, setEstilo] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const prefs = (userData?.preferencias ?? {}) as {
      clima?: string[];
      duracao?: string[];
      estilo?: string[];
    };
    if (prefs.clima?.length) setClima(prefs.clima);
    if (prefs.duracao?.length) setDuracao(prefs.duracao);
    if (prefs.estilo?.length) setEstilo(prefs.estilo);
  }, [userData]);

  async function handleSalvar() {
    if (clima.length === 0 || duracao.length === 0 || estilo.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos uma opção em cada grupo.');
      return;
    }

    const preferencias = { clima, duracao, estilo };
    const requisitos = montarRequisitos(preferencias);

    // DEV_FALLBACK: remove after Firebase integration is complete.
    // Modo desenvolvimento: sem Firebase, simula a gravacao e segue para /home.
    // No React Native Web o callback do botao do Alert nao dispara, entao
    // navegamos independente do Alert.
    if (!isFirebaseConfigured || !auth || !db || !user) {
      Alert.alert('Modo desenvolvimento', 'Preferências simuladas. Nada foi salvo no Firebase.');
      router.replace('/home');
      return;
    }

    setSalvando(true);
    try {
      await salvarPerfilUsuario(user.uid, {
        preferenciasConcluidas: true,
        preferencias,
        requisitos,
      });
      await refreshUserData();
      router.replace('/home');
    } catch (error: any) {
      console.error('[preferencias]', error);
      Alert.alert('Erro', 'Não foi possível salvar suas preferências. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: r.scaleY(8) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: r.font(20) }]}>Preferências de Viagem</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subtitle, { fontSize: r.font(14) }]}>
          Personalize suas preferências para receber roteiros mais adequados ao seu perfil.
        </Text>

        <ChipGroup
          title="Clima Preferido"
          options={CLIMA_OPTIONS}
          selected={clima}
          onToggle={(v) => setClima((prev) => toggleIn(prev, v))}
        />
        <ChipGroup
          title="Duração da Viagem"
          options={DURACAO_OPTIONS}
          selected={duracao}
          onToggle={(v) => setDuracao((prev) => toggleIn(prev, v))}
        />
        <ChipGroup
          title="Estilo de Viagem"
          options={ESTILO_OPTIONS}
          selected={estilo}
          onToggle={(v) => setEstilo((prev) => toggleIn(prev, v))}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { marginTop: r.scaleY(8) }, salvando && { opacity: 0.6 }]}
          activeOpacity={0.85}
          onPress={handleSalvar}
          disabled={salvando}
        >
          <Text style={[styles.saveBtnText, { fontSize: r.font(16) }]}>
            {salvando ? 'Salvando...' : 'Salvar Preferências'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { marginRight: 12 },
  headerTitle: { color: Colors.textWhite, fontWeight: '700' },
  content: { paddingHorizontal: 24, paddingTop: 8 },
  subtitle: { color: Colors.textGray, marginBottom: 28, lineHeight: 22 },
  group: { marginBottom: 28 },
  groupTitle: { color: Colors.textWhite, fontWeight: '700', marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(121,116,231,0.2)',
  },
  chipText: { color: Colors.textGray, fontWeight: '500' },
  chipTextActive: { color: Colors.primary },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700' },
});

import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { roteirosRecomendados, Roteiro } from '../data/mockRoteiros';
import { useAuth } from '../context/AuthContext';
import { buscarRoteiroUsuario, UserRoteiro } from '../services/roteiros';
import { useResponsive } from '../utils/responsive';

type Params = {
  id?: string;
  origem?: 'usuario' | 'recomendado';
};

function CityRow({ cidade, index }: { cidade: string; index: number }) {
  const r = useResponsive();
  return (
    <View style={styles.cityRow}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepText}>{index + 1}</Text>
      </View>
      <View style={styles.cityInfo}>
        <Text style={[styles.cityName, { fontSize: r.font(15) }]}>{cidade}</Text>
        <Text style={[styles.cityMeta, { fontSize: r.font(12) }]}>Parada do roteiro</Text>
      </View>
      <MaterialIcons name="place" size={20} color={Colors.primary} />
    </View>
  );
}

export default function RoteiroDetalhesScreen() {
  const router = useRouter();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Params>();
  const { user } = useAuth();
  const [roteiroUsuario, setRoteiroUsuario] = useState<UserRoteiro | null>(null);
  const [loading, setLoading] = useState(params.origem === 'usuario');

  useEffect(() => {
    let active = true;

    async function carregar() {
      if (params.origem !== 'usuario' || !params.id || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const roteiro = await buscarRoteiroUsuario(user.uid, params.id);
        if (active) setRoteiroUsuario(roteiro);
      } catch (error) {
        console.error('[roteiro-detalhes]', error);
      } finally {
        if (active) setLoading(false);
      }
    }

    carregar();
    return () => {
      active = false;
    };
  }, [params.id, params.origem, user]);

  const roteiro = useMemo<Roteiro | UserRoteiro | undefined>(() => {
    if (params.origem === 'usuario') return roteiroUsuario ?? undefined;
    return roteirosRecomendados.find((item) => item.id === params.id);
  }, [params.id, params.origem, roteiroUsuario]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!roteiro) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textWhite} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <MaterialIcons name="event-busy" size={46} color={Colors.textGray} />
          <Text style={[styles.emptyTitle, { fontSize: r.font(18) }]}>Roteiro não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const autor = roteiro.autorNome ?? (params.origem === 'usuario' ? 'Você' : 'Comunidade Brasil em Foco');
  const descricao =
    roteiro.descricao ??
    ('observacoes' in roteiro && roteiro.observacoes
      ? roteiro.observacoes
      : params.origem === 'usuario'
        ? 'Roteiro salvo na sua conta. As cidades adicionadas aparecem abaixo.'
        : 'Roteiro recomendado pela comunidade.');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: r.scaleY(8) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: r.font(18) }]}>Detalhes do Roteiro</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: roteiro.cor }]}>
          {roteiro.imagemUrl ? <Image source={{ uri: roteiro.imagemUrl }} style={styles.heroImage} /> : null}
          <View style={styles.heroOverlay}>
            <Text style={[styles.routeName, { fontSize: r.font(24) }]}>{roteiro.nome}</Text>
            <Text style={[styles.routeAuthor, { fontSize: r.font(13) }]}>Criado por {autor}</Text>
          </View>
        </View>

        <Text style={[styles.description, { fontSize: r.font(14) }]}>{descricao}</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <MaterialIcons name="schedule" size={20} color={Colors.primary} />
            <Text style={styles.metricLabel}>Duração</Text>
            <Text style={styles.metricValue}>{roteiro.duracao}</Text>
          </View>
          <View style={styles.metricBox}>
            <MaterialIcons name="explore" size={20} color={Colors.primary} />
            <Text style={styles.metricLabel}>Tipo</Text>
            <Text style={styles.metricValue}>{roteiro.tipo}</Text>
          </View>
          <View style={styles.metricBox}>
            <MaterialIcons name="route" size={20} color={Colors.primary} />
            <Text style={styles.metricLabel}>Distância</Text>
            <Text style={styles.metricValue}>{roteiro.distanciaKm} km</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: r.font(18) }]}>Cidades selecionadas</Text>
          <Text style={[styles.cityCount, { fontSize: r.font(13) }]}>{roteiro.cidades.length} parada(s)</Text>
        </View>

        {roteiro.cidades.length > 0 ? (
          roteiro.cidades.map((cidade, index) => <CityRow key={`${cidade}-${index}`} cidade={cidade} index={index} />)
        ) : (
          <Text style={[styles.emptyText, { fontSize: r.font(14) }]}>Nenhuma cidade adicionada ainda.</Text>
        )}
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
    paddingBottom: 14,
  },
  backBtn: { marginRight: 12 },
  headerTitle: { color: Colors.textWhite, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 6 },
  heroCard: {
    minHeight: 180,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 18,
  },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.55 },
  heroOverlay: { padding: 18, backgroundColor: 'rgba(0,0,0,0.25)' },
  routeName: { color: '#FFFFFF', fontWeight: '800', marginBottom: 6 },
  routeAuthor: { color: 'rgba(255,255,255,0.82)', fontWeight: '600' },
  description: { color: 'rgba(255,255,255,0.78)', lineHeight: 21, marginBottom: 18 },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: 14,
    padding: 12,
    minHeight: 104,
  },
  metricLabel: { color: Colors.textGray, fontSize: 11, marginTop: 8, marginBottom: 3 },
  metricValue: { color: Colors.textDark, fontSize: 13, fontWeight: '800' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { color: Colors.textWhite, fontWeight: '800' },
  cityCount: { color: Colors.textGray },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  cityInfo: { flex: 1 },
  cityName: { color: Colors.textDark, fontWeight: '800' },
  cityMeta: { color: Colors.textGray, marginTop: 2 },
  emptyText: { color: Colors.textGray },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { color: Colors.textWhite, fontWeight: '800' },
});

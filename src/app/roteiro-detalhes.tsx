import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {
  buscarRoteiroUsuario,
  UserRoteiro,
  deletarRoteiroUsuario,
  removerCidadeDoRoteiro,
  adicionarRoteiroRecomendadoAoUsuario,
} from '../services/roteiros';
import { sugerirCidades } from '../services/sugestoes';
import { useResponsive } from '../utils/responsive';
import { Cidade } from '../data/mockCidades';

const todasCidadesJson = require('../data/cidades.json') as Cidade[];

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  recife: { lat: -8.0476, lon: -34.877 },
  olinda: { lat: -8.0089, lon: -34.8553 },
  fortaleza: { lat: -3.7319, lon: -38.5267 },
  natal: { lat: -5.7793, lon: -35.2009 },
  'joao pessoa': { lat: -7.1195, lon: -34.845 },
  maceio: { lat: -9.6498, lon: -35.7089 },
  salvador: { lat: -12.9777, lon: -38.5016 },
  bonito: { lat: -21.1261, lon: -56.4836 },
  gramado: { lat: -29.3734, lon: -50.8762 },
  canela: { lat: -29.3639, lon: -50.8156 },
  curitiba: { lat: -25.4284, lon: -49.2733 },
  florianopolis: { lat: -27.5949, lon: -48.5482 },
  'sao paulo': { lat: -23.5558, lon: -46.6396 },
  'rio de janeiro': { lat: -22.9068, lon: -43.1729 },
  brasilia: { lat: -15.7939, lon: -47.8828 },
  manaus: { lat: -3.119, lon: -60.0217 },
  belem: { lat: -1.4558, lon: -48.5039 },
  'ouro preto': { lat: -20.3856, lon: -43.5035 },
};

type Params = {
  id?: string;
  origem?: 'usuario' | 'recomendado';
};

function CityRow({ cidade, index, onRemove }: { cidade: string; index: number; onRemove?: () => void }) {
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MaterialIcons name="place" size={20} color={Colors.primary} />
        {onRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
            <MaterialIcons name="close" size={18} color={Colors.textGray} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function SuggestionCard({ cidade }: { cidade: Cidade }) {
  const r = useResponsive();
  return (
    <View style={styles.suggestionCard}>
      <View style={styles.suggestionIcon}>
        <MaterialIcons name="near-me" size={16} color={Colors.primary} />
      </View>
      <View style={styles.suggestionInfo}>
        <Text style={[styles.suggestionName, { fontSize: r.font(13) }]}>{cidade.nome}</Text>
        <Text style={[styles.suggestionMeta, { fontSize: r.font(11) }]}>{cidade.categoria}</Text>
      </View>
      <MaterialIcons name="arrow-forward" size={16} color={Colors.textGray} />
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
  const [salvando, setSalvando] = useState(false);

  const todasCidades = useMemo(
    () => [...todasCidadesJson].sort((a, b) => a.nome.localeCompare(b.nome)),
    []
  );

  const cidadeMap = useMemo(() => {
    const map = new Map<string, Cidade>();
    todasCidades.forEach((c) => {
      map.set(c.id, c);
    });
    return map;
  }, [todasCidades]);

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

  const roteiroDetalhadoCidades = useMemo(() => {
    if (!roteiro || !('cidadeIds' in roteiro)) return [];
    return (roteiro.cidadeIds ?? [])
      .map((id) => cidadeMap.get(id))
      .filter((c): c is Cidade => Boolean(c));
  }, [roteiro, cidadeMap]);

  const sugestoesDeProximas = useMemo(() => {
    if (!roteiro || roteiroDetalhadoCidades.length === 0) return [];
    const ultimaCidade = roteiroDetalhadoCidades[roteiroDetalhadoCidades.length - 1];
    return sugerirCidades(
      ultimaCidade,
      roteiroDetalhadoCidades,
      todasCidades,
      roteiro.cidadeIds ?? [],
      CITY_COORDS,
      3
    );
  }, [roteiro, roteiroDetalhadoCidades, todasCidades]);

  async function handleRemoverCidade(index: number) {
    if (!roteiro || !('cidadeIds' in roteiro) || params.origem !== 'usuario' || !roteiroUsuario) return;

    const cidadeId = roteiroUsuario.cidadeIds?.[index];
    const cidadeLabel = roteiroUsuario.cidades?.[index];

    if (!cidadeId || !cidadeLabel) return;

    Alert.alert(
      'Remover Cidade',
      `Tem certeza que deseja remover ${cidadeLabel}?`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Remover',
          onPress: async () => {
            try {
              await removerCidadeDoRoteiro(roteiroUsuario.id, cidadeLabel, cidadeId);
              const atualizado = await buscarRoteiroUsuario(user!.uid, roteiroUsuario.id);
              setRoteiroUsuario(atualizado);
            } catch (error) {
              console.error('[remover-cidade]', error);
              Alert.alert('Erro', 'Não foi possível remover a cidade.');
            }
          },
        },
      ]
    );
  }

  async function handleDeletarRoteiro() {
    if (!roteiroUsuario || params.origem !== 'usuario') return;

    Alert.alert(
      'Deletar Roteiro',
      `Tem certeza que deseja deletar "${roteiroUsuario.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Deletar',
          onPress: async () => {
            try {
              await deletarRoteiroUsuario(roteiroUsuario.id);
              router.replace('/roteiros');
            } catch (error) {
              console.error('[deletar-roteiro]', error);
              Alert.alert('Erro', 'Não foi possível deletar o roteiro.');
            }
          },
        },
      ]
    );
  }

  async function handleSalvarRecomendado() {
    if (!roteiro || params.origem !== 'recomendado' || !user) return;

    setSalvando(true);
    try {
      await adicionarRoteiroRecomendadoAoUsuario(user.uid, roteiro as UserRoteiro);
      Alert.alert('Sucesso', 'Roteiro salvo na sua coleção!');
      router.replace('/roteiros');
    } catch (error) {
      console.error('[salvar-recomendado]', error);
      Alert.alert('Erro', 'Não foi possível salvar o roteiro.');
    } finally {
      setSalvando(false);
    }
  }

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

  const isRoteiroProprio = params.origem === 'usuario';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: r.scaleY(8) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: r.font(18) }]}>Detalhes do Roteiro</Text>
        <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 8 }}>
          {isRoteiroProprio && (
            <>
              <TouchableOpacity onPress={() => router.push(`/editar-roteiro?id=${params.id}`)}>
                <MaterialIcons name="edit" size={24} color={Colors.textWhite} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeletarRoteiro}>
                <MaterialIcons name="delete" size={24} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
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
          roteiro.cidades.map((cidade, index) => (
            <CityRow
              key={`${cidade}-${index}`}
              cidade={cidade}
              index={index}
              onRemove={isRoteiroProprio ? () => handleRemoverCidade(index) : undefined}
            />
          ))
        ) : (
          <Text style={[styles.emptyText, { fontSize: r.font(14) }]}>Nenhuma cidade adicionada ainda.</Text>
        )}

        {/* Sugestões de cidades próximas */}
        {isRoteiroProprio && sugestoesDeProximas.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={[styles.sectionTitle, { fontSize: r.font(18) }]}>Sugestões Próximas</Text>
            </View>
            <Text style={[styles.sectionSubtitle, { fontSize: r.font(12) }]}>
              Cidades próximas à sua última parada
            </Text>
            {sugestoesDeProximas.map((cidade) => (
              <SuggestionCard key={cidade.id} cidade={cidade} />
            ))}
          </>
        )}
      </ScrollView>

      {/* Footer Button */}
      {params.origem === 'recomendado' && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.salvarBtn, salvando && { opacity: 0.6 }]}
            onPress={handleSalvarRecomendado}
            disabled={salvando}
          >
            <Text style={[styles.salvarText, { fontSize: r.font(15) }]}>
              {salvando ? 'Salvando...' : 'Salvar Roteiro'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  sectionSubtitle: { color: Colors.textGray, marginBottom: 12 },
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
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: Colors.textGray },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { color: Colors.textWhite, fontWeight: '800' },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionInfo: { flex: 1 },
  suggestionName: { color: Colors.textDark, fontWeight: '700' },
  suggestionMeta: { color: Colors.textGray, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  salvarBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  salvarText: { color: Colors.textWhite, fontWeight: '700' },
});

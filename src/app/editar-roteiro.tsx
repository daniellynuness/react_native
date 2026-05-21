import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Cidade } from '../data/mockCidades';
import { useAuth } from '../context/AuthContext';
import {
  buscarRoteiroUsuario,
  UserRoteiro,
  atualizarRoteiroUsuario,
} from '../services/roteiros';
import { useResponsive } from '../utils/responsive';

const todasCidadesJson = require('../data/cidades.json') as Cidade[];
const CORES = ['#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#8B5CF6', '#0891B2'];
const TEMAS = ['Praia', 'Natureza', 'Cultura', 'Histórico', 'Gastronomia', 'Aventura', 'Relaxamento', 'Esportes'];

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

function normalizeCityName(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function estimateDistanceKm(origem: Cidade, destino: Cidade) {
  const coordOrigem = CITY_COORDS[normalizeCityName(origem.nome)];
  const coordDestino = CITY_COORDS[normalizeCityName(destino.nome)];
  if (coordOrigem && coordDestino) return haversineKm(coordOrigem, coordDestino);
  if (origem.estado === destino.estado) return 90;
  if (origem.regiao === destino.regiao) return 280;
  return 950;
}

type Params = {
  id?: string;
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

export default function EditarRoteiroScreen() {
  const router = useRouter();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Params>();
  const { user } = useAuth();

  const [roteiro, setRoteiro] = useState<UserRoteiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [temasSelecionados, setTemasSelecionados] = useState<string[]>([]);
  const [cidadesSelecionadas, setCidadesSelecionadas] = useState<string[]>([]);
  const [corSelecionada, setCorSelecionada] = useState(CORES[0]);

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

  const cidadesSelecionadasDetalhadas = useMemo(
    () => cidadesSelecionadas.map((id) => cidadeMap.get(id)).filter((c): c is Cidade => Boolean(c)),
    [cidadesSelecionadas, cidadeMap]
  );

  const trechosDistancia = useMemo(() => {
    return cidadesSelecionadasDetalhadas.slice(0, -1).map((cidade, index) => {
      const proxima = cidadesSelecionadasDetalhadas[index + 1];
      return {
        origem: cidade,
        destino: proxima,
        distanciaKm: estimateDistanceKm(cidade, proxima),
      };
    });
  }, [cidadesSelecionadasDetalhadas]);

  const distanciaTotalKm = useMemo(
    () => trechosDistancia.reduce((total, trecho) => total + trecho.distanciaKm, 0),
    [trechosDistancia]
  );

  const duracaoCalculada = useMemo(() => {
    const count = cidadesSelecionadasDetalhadas.length;
    if (count === 0) return 'A definir';
    if (count === 1) return '1 dia';
    if (count > 6 || distanciaTotalKm > 1800) return '7+ dias';
    if (count > 3 || distanciaTotalKm > 700) return '4-7 dias';
    if (distanciaTotalKm > 250) return '2-3 dias';
    if (count <= 3) return '2-3 dias';
    return '7+ dias';
  }, [cidadesSelecionadasDetalhadas.length, distanciaTotalKm]);

  useEffect(() => {
    let active = true;

    async function carregar() {
      if (!params.id || !user) {
        setLoading(false);
        return;
      }

      try {
        const rot = await buscarRoteiroUsuario(user.uid, params.id);
        if (active && rot) {
          setRoteiro(rot);
          setNome(rot.nome);
          setDescricao(rot.descricao || '');
          setTemasSelecionados(rot.temas || []);
          setCidadesSelecionadas(rot.cidadeIds || []);
          setCorSelecionada(rot.cor);
        }
      } catch (error) {
        console.error('[editar-roteiro]', error);
      } finally {
        if (active) setLoading(false);
      }
    }

    carregar();
    return () => {
      active = false;
    };
  }, [params.id, user]);

  function removeCidade(index: number) {
    setCidadesSelecionadas((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleTema(tema: string) {
    setTemasSelecionados((prev) =>
      prev.includes(tema) ? prev.filter((t) => t !== tema) : [...prev, tema]
    );
  }

  async function handleSalvarAlteracoes() {
    if (!roteiro || !nome.trim()) {
      Alert.alert('Atenção', 'O nome do roteiro não pode estar vazio.');
      return;
    }

    setSalvando(true);
    try {
      await atualizarRoteiroUsuario(roteiro.id, {
        nome: nome.trim(),
        descricao: descricao.trim(),
        temas: temasSelecionados,
        cidades: cidadesSelecionadasDetalhadas.map((c) => `${c.nome}, ${c.estado}`),
        cidadeIds: cidadesSelecionadas,
        cor: corSelecionada,
        duracao: duracaoCalculada,
        distanciaKm: distanciaTotalKm,
      });
      Alert.alert('Sucesso', 'Roteiro atualizado com sucesso!');
      router.back();
    } catch (error) {
      console.error('[salvar-alteracoes]', error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
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
          <Text style={[styles.headerTitle, { fontSize: r.font(18) }]}>Roteiro não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: r.scaleY(8) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: r.font(18) }]}>EDITAR ROTEIRO</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Nome */}
        <Text style={[styles.label, { fontSize: r.font(15) }]}>Nome do Roteiro</Text>
        <TextInput
          style={[styles.input, { fontSize: r.font(15) }]}
          placeholder="Nome do Roteiro"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={nome}
          onChangeText={setNome}
        />

        {/* Descrição */}
        <Text style={[styles.label, { fontSize: r.font(15), marginTop: 16 }]}>Descrição</Text>
        <TextInput
          style={[styles.textAreaInput, { fontSize: r.font(14) }]}
          placeholder="Descreva seu roteiro..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Temas/Palavras-chave */}
        <Text style={[styles.label, { fontSize: r.font(15), marginTop: 16 }]}>Temas/Palavras-chave</Text>
        <View style={styles.temasContainer}>
          {TEMAS.map((tema) => (
            <TouchableOpacity
              key={tema}
              style={[
                styles.temaBadge,
                temasSelecionados.includes(tema) && styles.temaBadgeActive,
              ]}
              onPress={() => toggleTema(tema)}
            >
              <Text
                style={[
                  styles.temaBadgeText,
                  { fontSize: r.font(12) },
                  temasSelecionados.includes(tema) && styles.temaBadgeTextActive,
                ]}
              >
                {tema}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cidades */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.label, { fontSize: r.font(15), marginTop: 16 }]}>
            Cidades ({cidadesSelecionadas.length})
          </Text>
        </View>

        {cidadesSelecionadasDetalhadas.length > 0 ? (
          cidadesSelecionadasDetalhadas.map((c, index) => (
            <CityRow
              key={c.id}
              cidade={`${c.nome}, ${c.estado}`}
              index={index}
              onRemove={() => removeCidade(index)}
            />
          ))
        ) : (
          <Text style={[styles.emptyText, { fontSize: r.font(14) }]}>Nenhuma cidade adicionada.</Text>
        )}

        {/* Distância */}
        <Text style={[styles.label, { fontSize: r.font(15), marginTop: 16 }]}>Distância estimada:</Text>
        <View style={styles.metricBox}>
          <View style={styles.metricBoxRow}>
            <MaterialIcons name="route" size={18} color={Colors.textDark} />
            <Text style={[styles.metricValue, { fontSize: r.font(14), marginLeft: 8 }]}>
              {cidadesSelecionadasDetalhadas.length > 1 ? `${distanciaTotalKm} km no total` : 'A definir'}
            </Text>
          </View>
          {trechosDistancia.length > 0 ? (
            <View style={styles.distanceList}>
              {trechosDistancia.map((trecho) => (
                <Text
                  key={`${trecho.origem.id}-${trecho.destino.id}`}
                  style={[styles.distanceText, { fontSize: r.font(12) }]}
                >
                  {trecho.origem.nome} → {trecho.destino.nome}: {trecho.distanciaKm} km
                </Text>
              ))}
            </View>
          ) : (
            <Text style={[styles.metricNote, { fontSize: r.font(12) }]}>
              Adicione pelo menos duas cidades para calcular os trechos.
            </Text>
          )}
        </View>

        {/* Duração */}
        <Text style={[styles.label, { fontSize: r.font(15), marginTop: 16 }]}>Duração:</Text>
        <View style={styles.metricBox}>
          <View style={styles.metricBoxRow}>
            <MaterialIcons name="schedule" size={18} color={Colors.textDark} />
            <Text style={[styles.metricValue, { fontSize: r.font(14), marginLeft: 8 }]}>{duracaoCalculada}</Text>
          </View>
          <Text style={[styles.metricNote, { fontSize: r.font(12) }]}>
            Calculada automaticamente
          </Text>
        </View>

        {/* Cor */}
        <Text style={[styles.label, { fontSize: r.font(15), marginTop: 16 }]}>Cor do Roteiro:</Text>
        <View style={styles.coresRow}>
          {CORES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.corDot,
                { backgroundColor: c, borderWidth: c === corSelecionada ? 3 : 0, borderColor: '#FFF' },
              ]}
              onPress={() => setCorSelecionada(c)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.cancelarBtn} onPress={() => router.back()}>
          <Text style={[styles.cancelarText, { fontSize: r.font(15) }]}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.salvarBtn, salvando && { opacity: 0.6 }]}
          onPress={handleSalvarAlteracoes}
          disabled={salvando}
        >
          <Text style={[styles.salvarText, { fontSize: r.font(15) }]}>
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: { marginRight: 12 },
  headerTitle: { color: Colors.textWhite, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 6 },
  label: { color: Colors.textWhite, fontWeight: '700', marginBottom: 8 },
  input: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  textAreaInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textWhite,
    minHeight: 80,
  },
  temasContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  temaBadge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  temaBadgeActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  temaBadgeText: { color: Colors.textWhite, fontWeight: '500' },
  temaBadgeTextActive: { color: '#FFFFFF', fontWeight: '700' },
  sectionHeader: { marginBottom: 12 },
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
  metricBox: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 8,
  },
  metricBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: { color: Colors.textDark, fontWeight: '700' },
  metricNote: { color: Colors.textGray, marginTop: 4 },
  distanceList: { marginTop: 8, gap: 4 },
  distanceText: { color: Colors.textGray, lineHeight: 18 },
  coresRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  corDot: { width: 28, height: 28, borderRadius: 14 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  cancelarBtn: {
    flex: 1,
    backgroundColor: '#5A5A8A',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelarText: { color: Colors.textWhite, fontWeight: '600' },
  salvarBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  salvarText: { color: Colors.textWhite, fontWeight: '700' },
});

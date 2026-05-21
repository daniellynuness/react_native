import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
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
import { auth, db, isFirebaseConfigured } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { criarRoteiroUsuario } from '../services/roteiros';
import { useResponsive } from '../utils/responsive';

const todasCidadesJson = require('../data/cidades.json') as Cidade[];
const TIPOS = ['Econômico', 'Conforto', 'Aventura'];
const CLIMAS = ['Ensolarado', 'Frio', 'Chuvoso', 'Temperado'];
const ENERGIAS = ['Calmo', 'Moderado', 'Intenso'];
const CORES = ['#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#8B5CF6', '#0891B2'];

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

export default function CriarRoteiroScreen() {
  const router = useRouter();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [nome, setNome] = useState('');
  const [cidadesSelecionadas, setCidadesSelecionadas] = useState<string[]>([]);
  const [filtroCidade, setFiltroCidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [corSelecionada, setCorSelecionada] = useState(CORES[0]);
  const [privado, setPrivado] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const todasCidades = useMemo(
    () => [...todasCidadesJson].sort((a, b) => a.nome.localeCompare(b.nome)),
    [],
  );

  const cidadeMap = useMemo(() => {
    const map = new Map<string, Cidade>();
    todasCidades.forEach((c) => {
      map.set(c.id, c);
    });
    return map;
  }, [todasCidades]);

  const cidadesFiltradas = useMemo(() => {
    const termo = filtroCidade.trim().toLowerCase();
    if (!termo) return [];
    return todasCidades.filter((c) => c.nome.toLowerCase().includes(termo));
  }, [filtroCidade, todasCidades]);

  function moveCidadeUp(index: number) {
    setCidadesSelecionadas((prev) => {
      if (index <= 0) return prev;
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveCidadeDown(index: number) {
    setCidadesSelecionadas((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function removeCidade(id: string) {
    setCidadesSelecionadas((prev) => prev.filter((x) => x !== id));
  }

  const cidadesSelecionadasDetalhadas = useMemo(
    () => cidadesSelecionadas.map((id) => cidadeMap.get(id)).filter((c): c is Cidade => Boolean(c)),
    [cidadesSelecionadas, cidadeMap],
  );

  const tipoCalculado = useMemo(() => {
    if (cidadesSelecionadasDetalhadas.length === 0) return 'A definir';
    if (cidadesSelecionadasDetalhadas.some((c) => ['Praia', 'Natureza'].includes(c.categoria))) {
      return 'Aventura';
    }
    if (cidadesSelecionadasDetalhadas.some((c) => ['Cultura', 'Histórico', 'Gastronomia'].includes(c.categoria))) {
      return 'Conforto';
    }
    return 'Econômico';
  }, [cidadesSelecionadasDetalhadas]);

  const climaCalculado = useMemo(() => {
    if (cidadesSelecionadasDetalhadas.length === 0) return 'A definir';
    if (cidadesSelecionadasDetalhadas.some((c) => c.categoria === 'Praia')) return 'Ensolarado';
    if (cidadesSelecionadasDetalhadas.some((c) => c.categoria === 'Natureza')) return 'Temperado';
    return 'Temperado';
  }, [cidadesSelecionadasDetalhadas]);

  const energiaCalculada = useMemo(() => {
    if (cidadesSelecionadasDetalhadas.length === 0) return 'A definir';
    if (cidadesSelecionadasDetalhadas.some((c) => c.categoria === 'Histórico')) return 'Calmo';
    if (cidadesSelecionadasDetalhadas.some((c) => c.categoria === 'Praia')) return 'Moderado';
    return 'Intenso';
  }, [cidadesSelecionadasDetalhadas]);

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
    [trechosDistancia],
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

  function toggleCidade(id: string) {
    setCidadesSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSalvar() {
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      Alert.alert('Atenção', 'Informe o nome do roteiro.');
      return;
    }
    if (cidadesSelecionadas.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos uma cidade.');
      return;
    }

    if (!isFirebaseConfigured || !auth || !db || !user) {
      Alert.alert('Firebase necessário', 'Faça login com Firebase configurado para salvar roteiros.');
      return;
    }

    setSalvando(true);
    try {
      await criarRoteiroUsuario({
        uid: user.uid,
        nome: nomeTrim,
        cidades: cidadesSelecionadasDetalhadas.map((c) => `${c.nome}, ${c.estado}`),
        cidadeIds: cidadesSelecionadas,
        duracao: duracaoCalculada,
        tipo: tipoCalculado,
        clima: climaCalculado,
        energia: energiaCalculada,
        observacoes: observacoes.trim(),
        cor: corSelecionada,
        privado,
      });
      router.replace('/roteiros');
    } catch (error) {
      console.error('[criar-roteiro]', error);
      Alert.alert('Erro', 'Não foi possível salvar o roteiro. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: r.scaleY(8) }]}>
        <TouchableOpacity onPress={() => router.replace('/roteiros')} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: r.font(18) }]}>CRIAR ROTEIRO</Text>
        <TouchableOpacity style={{ marginLeft: 'auto' }}>
          <MaterialIcons name="more-vert" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nome do Roteiro */}
        <Text style={[styles.label, { fontSize: r.font(15) }]}>Nome do Roteiro</Text>
        <TextInput
          style={[styles.nomeInput, { fontSize: r.font(15) }]}
          placeholder="Nome do Roteiro"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={nome}
          onChangeText={setNome}
        />

        {/* Cidades — selecao a partir de mockCidades */}
        <Text style={[styles.label, { fontSize: r.font(15), marginTop: 20 }]}>
          Cidades ({cidadesSelecionadas.length} selecionada{cidadesSelecionadas.length === 1 ? '' : 's'})
        </Text>
        <View style={styles.addCidadeBox}>
          {cidadesSelecionadasDetalhadas.length > 0 && (
            <View style={styles.selectedCitiesBox}>
              {cidadesSelecionadasDetalhadas.map((c, index) => (
                <View style={styles.selectedCityRow} key={c.id}>
                  <View style={styles.selectedCityInfo}>
                    <MaterialIcons name="drag-handle" size={18} color={Colors.textGray} />
                    <Text style={[styles.selectedCityText, { fontSize: r.font(14) }]}>
                      {c.nome}, {c.estado}
                    </Text>
                  </View>
                  <View style={styles.selectedCityActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => moveCidadeUp(index)}
                      disabled={index === 0}
                    >
                      <MaterialIcons name="arrow-upward" size={18} color={index === 0 ? 'rgba(255,255,255,0.3)' : Colors.textWhite} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => moveCidadeDown(index)}
                      disabled={index === cidadesSelecionadasDetalhadas.length - 1}
                    >
                      <MaterialIcons
                        name="arrow-downward"
                        size={18}
                        color={index === cidadesSelecionadasDetalhadas.length - 1 ? 'rgba(255,255,255,0.3)' : Colors.textWhite}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => removeCidade(c.id)}
                    >
                      <MaterialIcons name="close" size={18} color={Colors.textWhite} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
          <TextInput
            style={[styles.addCidadeInput, { fontSize: r.font(14) }]}
            placeholder="Buscar cidades..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={filtroCidade}
            onChangeText={setFiltroCidade}
            autoCapitalize="none"
          />
          {!filtroCidade && (
            <Text style={[styles.cidadeHint, { fontSize: r.font(12) }]}>Pesquise uma cidade para adicionar ao roteiro.</Text>
          )}
          <View style={styles.cidadeChips}>
            {cidadesFiltradas.map((c) => {
              const selected = cidadesSelecionadas.includes(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.cidadeChip, selected && styles.cidadeChipActive]}
                  onPress={() => toggleCidade(c.id)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={selected ? 'check-circle' : 'place'}
                    size={16}
                    color={selected ? '#FFFFFF' : Colors.textWhite}
                  />
                  <Text style={[styles.cidadeChipText, { fontSize: r.font(13) }, selected && styles.cidadeChipTextActive]}>
                    {c.nome}/{c.estado}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {cidadesFiltradas.length === 0 && (
              <Text style={[styles.cidadeEmpty, { fontSize: r.font(13) }]}>Nenhuma cidade encontrada.</Text>
            )}
          </View>
        </View>

        {/* Duração */}
        <Text style={[styles.label, { fontSize: r.font(15), marginTop: 16 }]}>Duração:</Text>
        <View style={styles.metricBox}>
          <View style={styles.metricBoxRow}>
            <MaterialIcons name="schedule" size={18} color={Colors.textDark} />
            <Text style={[styles.metricValue, { fontSize: r.font(14), marginLeft: 8 }]}>{duracaoCalculada}</Text>
          </View>
          <Text style={[styles.metricNote, { fontSize: r.font(12) }]}>
            Calculada por quantidade de cidades e distância estimada
          </Text>
        </View>

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
                  {trecho.origem.nome} {'->'} {trecho.destino.nome}: {trecho.distanciaKm} km
                </Text>
              ))}
            </View>
          ) : (
            <Text style={[styles.metricNote, { fontSize: r.font(12) }]}>
              Adicione pelo menos duas cidades para calcular os trechos.
            </Text>
          )}
        </View>

        {/* Tipo */}
        <Text style={[styles.label, { fontSize: r.font(15), marginTop: 16 }]}>Tipo de Roteiro:</Text>
        <View style={styles.metricBox}>
          <View style={styles.metricBoxRow}>
            <MaterialIcons name="explore" size={18} color={Colors.textDark} />
            <Text style={[styles.metricValue, { fontSize: r.font(14), marginLeft: 8 }]}>{tipoCalculado}</Text>
          </View>
          <Text style={[styles.metricNote, { fontSize: r.font(12) }]}>Calculado automaticamente</Text>
        </View>

        {/* Clima e Energia */}
        <View style={styles.rowInfo}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { fontSize: r.font(15) }]}>Clima:</Text>
            <View style={styles.metricBoxInline}>
            <MaterialIcons name="wb-sunny" size={16} color={Colors.textDark} />
            <Text style={[styles.metricValue, { fontSize: r.font(13), marginLeft: 6 }]}>{climaCalculado}</Text>
          </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { fontSize: r.font(15) }]}>Energia:</Text>
            <View style={styles.metricBoxInline}>
              <MaterialIcons name="whatshot" size={16} color={Colors.textDark} />
              <Text style={[styles.metricValue, { fontSize: r.font(13), marginLeft: 6 }]}>{energiaCalculada}</Text>
            </View>
          </View>
        </View>

        {/* Cor do Roteiro */}
        <Text style={[styles.label, { fontSize: r.font(15), marginTop: 16 }]}>Cor do Roteiro:</Text>
        <View style={styles.corSelector}>
          <MaterialIcons name="palette" size={18} color={corSelecionada} />
          <Text style={[styles.corSelectorText, { fontSize: r.font(14) }]}>Selecionar Cor</Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.textWhite} style={{ marginLeft: 'auto' }} />
        </View>
        <View style={styles.coresRow}>
          {CORES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.corDot, { backgroundColor: c, borderWidth: c === corSelecionada ? 3 : 0, borderColor: '#FFF' }]}
              onPress={() => setCorSelecionada(c)}
            />
          ))}
        </View>

        {/* Observacoes */}
        <Text style={[styles.label, { fontSize: r.font(15), marginTop: 16 }]}>Observações:</Text>
        <TextInput
          style={[styles.observacoesInput, { fontSize: r.font(14) }]}
          placeholder="Anotações ou descrição do roteiro (opcional)"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={observacoes}
          onChangeText={setObservacoes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Privacidade */}
        <Text style={[styles.label, { fontSize: r.font(15), marginTop: 16 }]}>Privacidade do Roteiro:</Text>
        <View style={styles.privacidadeRow}>
          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setPrivado(false)}
          >
            <View style={[styles.radio, !privado && styles.radioSelected]} />
            <Text style={[styles.radioLabel, { fontSize: r.font(14) }]}>Público</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => setPrivado(true)}
          >
            <View style={[styles.radio, privado && styles.radioSelected]} />
            <Text style={[styles.radioLabel, { fontSize: r.font(14) }]}>Privado</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.descartarBtn} onPress={() => router.replace('/roteiros')}>
          <Text style={[styles.descartarText, { fontSize: r.font(15) }]}>Descartar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.salvarBtn, salvando && { opacity: 0.6 }]} onPress={handleSalvar} disabled={salvando}>
          <Text style={[styles.salvarText, { fontSize: r.font(15) }]}>
            {salvando ? 'Salvando...' : 'Salvar Roteiro'}
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
  headerTitle: { color: Colors.textWhite, fontWeight: '700', letterSpacing: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  label: { color: Colors.textWhite, fontWeight: '700', marginBottom: 8 },
  nomeInput: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  addCidadeBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  addCidadeInput: {
    color: Colors.textWhite,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  addCidadeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  addCidadeBtnText: { color: '#10B981', fontWeight: '600' },
  cidadeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  cidadeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cidadeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cidadeChipText: { color: Colors.textWhite, fontWeight: '500' },
  cidadeChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  cidadeHint: { color: Colors.textGray, marginBottom: 8 },
  selectedCitiesBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  selectedCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  selectedCityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectedCityText: { color: Colors.textWhite, fontWeight: '600' },
  selectedCityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cidadeEmpty: { color: Colors.textGray, fontStyle: 'italic', paddingVertical: 4 },
  metricBox: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 8,
  },
  metricBoxInline: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  metricBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: { color: Colors.textDark, fontWeight: '700' },
  metricNote: { color: Colors.textGray, marginTop: 4 },
  distanceList: { marginTop: 8, gap: 4 },
  distanceText: { color: Colors.textGray, lineHeight: 18 },
  observacoesInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textWhite,
    minHeight: 96,
  },
  cidadeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 10,
  },
  cidadeNome: { color: Colors.textDark },
  rowInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  infoBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  infoBadgeText: { color: '#FFF', fontWeight: '600' },
  optionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  optionChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  optionChipSm: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  optionChipText: { color: Colors.textWhite, fontWeight: '600' },
  corSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 12,
  },
  corSelectorText: { color: Colors.textWhite },
  coresRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  corDot: { width: 28, height: 28, borderRadius: 14 },
  privacidadeRow: { flexDirection: 'row', gap: 24, marginTop: 4 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textWhite,
    backgroundColor: 'transparent',
  },
  radioSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radioLabel: { color: Colors.textWhite },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  descartarBtn: {
    flex: 1,
    backgroundColor: '#5A5A8A',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  descartarText: { color: Colors.textWhite, fontWeight: '600' },
  salvarBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  salvarText: { color: Colors.textWhite, fontWeight: '700' },
});

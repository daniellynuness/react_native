import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import StarRating from '../components/ui/StarRating';
import { Colors } from '../constants/Colors';
import { avaliacoesComunidade } from '../data/mockAvaliacoes';
import { cidadesRecomendadas, ultimasVisualizadas, Cidade } from '../data/mockCidades';
import { useAuth } from '../context/AuthContext';
import { auth, db, isFirebaseConfigured } from '../services/firebase';
import { adicionarCidadeAoRoteiroAutomatico } from '../services/roteiros';
import { useResponsive } from '../utils/responsive';

// Mock extra city details
const detalhesExtra: Record<string, { local: string; populacao: string; valorEstimado: string; historia: string }> = {
  default: {
    local: 'Região turística, consulte informações locais.',
    populacao: '–',
    valorEstimado: 'R$ 250,00 por pessoa, ao dia',
    historia: 'Cidade com rica história e cultura, repleta de pontos turísticos únicos que atraem visitantes do mundo inteiro.',
  },
};

export default function DetalhesCidadeScreen() {
  const router = useRouter();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();

  const cidade: Cidade | undefined =
    cidadesRecomendadas.find((c) => c.id === params.id) ??
    ultimasVisualizadas.find((c) => c.id === params.id);

  const [showReviews, setShowReviews] = useState(false);
  const [favoritado, setFavoritado] = useState(false);
  const [adicionandoRoteiro, setAdicionandoRoteiro] = useState(false);

  if (!cidade) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.notFoundHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.notFoundBack}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textWhite} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFoundBody}>
          <MaterialIcons name="location-off" size={48} color={Colors.textGray} />
          <Text style={[styles.notFoundTitle, { fontSize: r.font(18) }]}>
            Cidade não encontrada
          </Text>
          <TouchableOpacity style={styles.notFoundBtn} onPress={() => router.back()}>
            <Text style={styles.notFoundBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const det = detalhesExtra.default;
  const cidadeAtual = cidade;

  function handleFavoritar() {
    setFavoritado((v) => !v);
    // DEV_FALLBACK: remove after Firebase integration is complete.
    // Plugar: updateDoc(usuarios/{uid}, { favoritos: arrayUnion(cidade.id) })
    Alert.alert('Favoritos', 'Cidade favoritada no modo desenvolvimento.');
  }

  function handleAvaliar() {
    // DEV_FALLBACK: remove after Firebase integration is complete.
    // Plugar: navegar para tela de avaliacao ou abrir modal e gravar em avaliacoes/{uid_cidadeId}.
    Alert.alert('Avaliar', 'Avaliação simulada no modo desenvolvimento.');
  }

  async function handleAdicionarRoteiro() {
    if (!isFirebaseConfigured || !auth || !db || !user) {
      Alert.alert('Firebase necessário', 'Faça login com Firebase configurado para salvar cidades em roteiros.');
      return;
    }

    setAdicionandoRoteiro(true);
    try {
      const nomeRoteiro = await adicionarCidadeAoRoteiroAutomatico(user.uid, cidadeAtual);
      Alert.alert('Roteiro atualizado', `${cidadeAtual.nome} foi adicionada ao ${nomeRoteiro}.`);
    } catch (error) {
      console.error('[detalhes-cidade:roteiro]', error);
      Alert.alert('Erro', 'Não foi possível adicionar a cidade ao roteiro. Tente novamente.');
    } finally {
      setAdicionandoRoteiro(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        <View style={styles.heroWrapper}>
          <Image source={{ uri: cidade.imagemUrl }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { fontSize: r.font(20) }]}>Detalhes</Text>
          </View>
        </View>

        {/* Likes bar */}
        <View style={styles.likesBar}>
          <View style={styles.avatarGroup}>
            {['rayssa', 'fabio', 'jonas'].map((s) => (
              <Image
                key={s}
                source={{ uri: `https://picsum.photos/seed/${s}/40/40` }}
                style={styles.miniAvatar}
              />
            ))}
          </View>
          <Text style={[styles.likesText, { fontSize: r.font(15) }]}>+20 Gostaram</Text>
          <TouchableOpacity style={styles.shareBtn}>
            <MaterialIcons name="share" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={[styles.body, { paddingHorizontal: 20 }]}>
          <Text style={[styles.cidadeNome, { fontSize: r.font(24) }]}>{cidade.nome}</Text>
          <Text style={[styles.cidadeSub, { fontSize: r.font(13) }]}>
            {cidade.estado} • {cidade.regiao} • {cidade.categoria}
          </Text>

          {/* Rating row */}
          <View style={styles.ratingRow}>
            <Text style={[styles.ratingNum, { fontSize: r.font(16) }]}>{cidade.avaliacao.toFixed(1)}</Text>
            <StarRating value={cidade.avaliacao} size={18} />
            <TouchableOpacity onPress={() => setShowReviews((v) => !v)}>
              <Text style={[styles.verMaisBtn, { fontSize: r.font(14) }]}>Ver mais</Text>
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <ActionButton
              icon={favoritado ? 'favorite' : 'favorite-border'}
              label={favoritado ? 'Favoritado' : 'Favoritar'}
              onPress={handleFavoritar}
              r={r}
            />
            <ActionButton icon="star-rate" label="Avaliar" onPress={handleAvaliar} r={r} />
            <ActionButton
              icon="playlist-add"
              label={adicionandoRoteiro ? 'Salvando' : 'Roteiro'}
              onPress={handleAdicionarRoteiro}
              r={r}
              disabled={adicionandoRoteiro}
            />
          </View>

          {!showReviews ? (
            <>
              {/* Info cards */}
              <InfoCard icon="place" title="Local" desc={`${cidade.regiao}. ${det.local}`} r={r} />
              <InfoCard icon="people" title="População Residente" desc={det.populacao} r={r} />
              <InfoCard icon="attach-money" title="Valor Estimado de Viagem" desc={det.valorEstimado} r={r} />

              {/* História */}
              <Text style={[styles.sectionTitle, { fontSize: r.font(18) }]}>História</Text>
              <Text style={[styles.historiaText, { fontSize: r.font(15) }]}>{det.historia}</Text>
            </>
          ) : (
            <>
              {/* Community reviews */}
              {avaliacoesComunidade.map((av) => (
                <View key={av.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    {av.avatarUrl ? (
                      <Image source={{ uri: av.avatarUrl }} style={styles.reviewAvatar} />
                    ) : (
                      <View style={[styles.reviewAvatar, styles.reviewAvatarLetter]}>
                        <Text style={styles.reviewAvatarLetterText}>{av.avatarLetra}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={styles.reviewMeta}>
                        <Text style={[styles.reviewAutor, { fontSize: r.font(15) }]}>{av.autorNome}</Text>
                        <Text style={[styles.reviewData, { fontSize: r.font(13) }]}>{av.data}</Text>
                        <Text style={[styles.reviewNota, { fontSize: r.font(15) }]}>
                          {av.nota.toFixed(1)}{' '}
                          <MaterialIcons name="star" size={14} color="#F59E0B" />
                        </Text>
                      </View>
                      {av.comentario ? (
                        <Text style={[styles.reviewComentario, { fontSize: r.font(14) }]}>{av.comentario}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.reviewDivider} />
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  r,
  disabled,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  r: ReturnType<typeof import('../utils/responsive').useResponsive>;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity style={[actionStyles.btn, disabled && { opacity: 0.6 }]} onPress={onPress} activeOpacity={0.85} disabled={disabled}>
      <MaterialIcons name={icon} size={20} color="#FFFFFF" />
      <Text style={[actionStyles.label, { fontSize: r.font(13) }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const actionStyles = StyleSheet.create({
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  label: { color: '#FFFFFF', fontWeight: '600' },
});

function InfoCard({
  icon,
  title,
  desc,
  r,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  desc: string;
  r: ReturnType<typeof import('../utils/responsive').useResponsive>;
}) {
  return (
    <View style={infoStyles.card}>
      <View style={infoStyles.iconBox}>
        <MaterialIcons name={icon} size={24} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[infoStyles.title, { fontSize: r.font(15) }]}>{title}</Text>
        <Text style={[infoStyles.desc, { fontSize: r.font(14) }]}>{desc}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(121,116,231,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Colors.textWhite, fontWeight: '700', marginBottom: 2 },
  desc: { color: 'rgba(255,255,255,0.75)' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heroWrapper: { position: 'relative', height: 260 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  backBtn: { marginRight: 12 },
  heroTitle: { color: '#FFFFFF', fontWeight: '700' },
  likesBar: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarGroup: { flexDirection: 'row' },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -6,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  likesText: { color: Colors.primary, fontWeight: '600', flex: 1 },
  shareBtn: {},
  body: { paddingTop: 24 },
  cidadeNome: { color: Colors.textWhite, fontWeight: '700', marginBottom: 4 },
  cidadeSub: { color: Colors.textGray, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  // Not-found
  notFoundHeader: { paddingHorizontal: 16, paddingTop: 8 },
  notFoundBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  notFoundBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  notFoundTitle: { color: Colors.textWhite, fontWeight: '700', textAlign: 'center' },
  notFoundBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  notFoundBtnText: { color: '#FFFFFF', fontWeight: '700' },
  ratingNum: { color: Colors.primary, fontWeight: '700' },
  verMaisBtn: { color: Colors.primary, marginLeft: 4 },
  sectionTitle: { color: Colors.textWhite, fontWeight: '700', marginTop: 8, marginBottom: 12 },
  historiaText: { color: 'rgba(255,255,255,0.8)', lineHeight: 24 },
  // Reviews
  reviewCard: { marginBottom: 4 },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  reviewAvatar: { width: 44, height: 44, borderRadius: 22 },
  reviewAvatarLetter: {
    backgroundColor: '#4B4B8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarLetterText: { color: '#FFFFFF', fontWeight: '700', fontSize: 18 },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  reviewAutor: { color: Colors.primary, fontWeight: '600' },
  reviewData: { color: Colors.textGray },
  reviewNota: { color: Colors.textWhite, fontWeight: '600', marginLeft: 'auto' },
  reviewComentario: { color: 'rgba(255,255,255,0.8)' },
  reviewDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
});

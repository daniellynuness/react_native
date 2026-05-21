import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import MainTabLayout from '../components/layout/MainTabLayout';
import { roteirosRecomendados, Roteiro } from '../data/mockRoteiros';
import { useAuth } from '../context/AuthContext';
import { rankRoteirosByPreferences, UserPreferences } from '../utils/preferences';
import { useResponsive } from '../utils/responsive';
import {
  adicionarRoteiroRecomendadoAoUsuario,
  buscarRoteiroFavoritadoPorNome,
  deletarRoteiroUsuario,
  listarRoteirosUsuario,
  UserRoteiro,
} from '../services/roteiros';

function RoteirCard({ roteiro, origem }: { roteiro: Roteiro; origem: 'usuario' | 'recomendado' }) {
  const r = useResponsive();
  const router = useRouter();
  const [favoritado, setFavoritado] = useState(roteiro.favoritado);

  return (
    <TouchableOpacity
      style={styles.roteiroCard}
      activeOpacity={0.86}
      onPress={() => router.push({ pathname: '/roteiro-detalhes', params: { id: roteiro.id, origem } })}
    >
      {roteiro.imagemUrl && (
        <Image source={{ uri: roteiro.imagemUrl }} style={styles.roteiroImg} />
      )}
      <View style={styles.roteiroBody}>
        <Text style={[styles.roteiroNome, { fontSize: r.font(16) }]} numberOfLines={2}>
          {roteiro.nome}
        </Text>
        <View style={styles.roteiroBadges}>
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { fontSize: r.font(11) }]}>{roteiro.duracao.toUpperCase()}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { fontSize: r.font(11) }]}>{roteiro.tipo.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={(event) => {
          event.stopPropagation();
          setFavoritado((v) => !v);
        }}
        style={styles.bookmarkBtn}
      >
        <MaterialIcons
          name={favoritado ? 'bookmark' : 'bookmark-border'}
          size={24}
          color={favoritado ? Colors.primary : Colors.textGray}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function RoteirosScreen() {
  const { user, userData } = useAuth();
  const preferencias = (userData?.preferencias ?? {}) as UserPreferences;
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const [busca, setBusca] = useState('');
  const [meusRoteiros, setMeusRoteiros] = useState<UserRoteiro[]>([]);
  const [carregandoMeusRoteiros, setCarregandoMeusRoteiros] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!user) {
        setMeusRoteiros([]);
        return;
      }

      setCarregandoMeusRoteiros(true);
      try {
        const roteiros = await listarRoteirosUsuario(user.uid);
        if (ativo) setMeusRoteiros(roteiros);
      } catch (error) {
        console.error('[roteiros]', error);
      } finally {
        if (ativo) setCarregandoMeusRoteiros(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [user]);

  const recomendados = useMemo(
    () => rankRoteirosByPreferences(roteirosRecomendados, preferencias),
    [userData?.preferencias],
  );

  const filtradosMeus = busca.trim()
    ? meusRoteiros.filter((rt) =>
        rt.nome.toLowerCase().includes(busca.toLowerCase())
      )
    : meusRoteiros;

  const filtradosRecomendados = busca.trim()
    ? recomendados.filter((rt) =>
        rt.nome.toLowerCase().includes(busca.toLowerCase())
      )
    : recomendados;

  return (
    <MainTabLayout activeTab="roteiro">
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header — sem botao de voltar, e uma aba principal */}
        <View style={{ paddingHorizontal: 20, paddingTop: r.scaleY(12), paddingBottom: 8 }}>
          <Text style={{ color: Colors.textWhite, fontSize: r.font(20), fontWeight: '700' }}>
            Roteiros Recomendados
          </Text>
        </View>

        {/* Search bar */}
        <View style={[styles.searchWrapper, { paddingTop: r.scaleY(8) }]}>
          <View style={styles.searchBar}>
            <TextInput
              style={[styles.searchInput, { fontSize: r.font(14) }]}
              placeholder="Pesquisar Roteiro"
              placeholderTextColor={Colors.primary}
              value={busca}
              onChangeText={setBusca}
            />
            <MaterialIcons name="search" size={22} color={Colors.textGray} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + r.scaleY(96) }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { fontSize: r.font(18) }]}>Meus Roteiros</Text>
          {carregandoMeusRoteiros ? (
            <Text style={[styles.emptyText, { fontSize: r.font(14) }]}>Carregando roteiros...</Text>
          ) : filtradosMeus.length > 0 ? (
            filtradosMeus.map((rt) => <RoteirCard key={rt.id} roteiro={rt} origem="usuario" />)
          ) : (
            <Text style={[styles.emptyText, { fontSize: r.font(14) }]}>Nenhum roteiro salvo ainda.</Text>
          )}

          <Text style={[styles.sectionTitle, { fontSize: r.font(18), marginTop: 20 }]}>Roteiros Recomendados</Text>
          {filtradosRecomendados.map((rt) => (
            <RoteirCard key={rt.id} roteiro={rt} origem="recomendado" />
          ))}
        </ScrollView>
      </SafeAreaView>
    </MainTabLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchWrapper: { paddingHorizontal: 20, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, color: Colors.primary },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  sectionTitle: { color: Colors.textWhite, fontWeight: '700', marginBottom: 16 },
  emptyText: { color: Colors.textGray, marginBottom: 8 },
  roteiroCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  roteiroImg: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 12,
  },
  roteiroBody: { flex: 1 },
  roteiroNome: { color: Colors.textDark, fontWeight: '700', marginBottom: 8 },
  roteiroBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: Colors.textDark },
  bookmarkBtn: { padding: 4 },
});

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import MainTabLayout from '../components/layout/MainTabLayout';
import { useResponsive } from '../utils/responsive';

const FILTER_TIPOS = ['Todas', 'Urbano', 'Rural', 'Populoso'];

type MapCity = {
  id: string;
  detailsId?: string;
  nome: string;
  estado: string;
  tipo: 'Urbano' | 'Rural' | 'Populoso';
  habitantes: string;
  tags: string[];
  latitude: number;
  longitude: number;
  imagemUrl: string;
};

const MAP_CITIES: MapCity[] = [
  {
    id: '8',
    detailsId: '8',
    nome: 'Recife',
    estado: 'PE',
    tipo: 'Populoso',
    habitantes: '1.6 mi habitantes',
    tags: ['Populoso', 'Historico', 'Litoral'],
    latitude: -8.0476,
    longitude: -34.877,
    imagemUrl: 'https://picsum.photos/seed/Recife/240/160',
  },
  {
    id: '2',
    detailsId: '2',
    nome: 'Salvador',
    estado: 'BA',
    tipo: 'Populoso',
    habitantes: '2.4 mi habitantes',
    tags: ['Cultura', 'Litoral', 'Gastronomia'],
    latitude: -12.9777,
    longitude: -38.5016,
    imagemUrl: 'https://picsum.photos/seed/Salvador/240/160',
  },
  {
    id: '5',
    detailsId: '5',
    nome: 'Fortaleza',
    estado: 'CE',
    tipo: 'Populoso',
    habitantes: '2.4 mi habitantes',
    tags: ['Praia', 'Eventos', 'Sol'],
    latitude: -3.7319,
    longitude: -38.5267,
    imagemUrl: 'https://picsum.photos/seed/Fortaleza/240/160',
  },
  {
    id: '9',
    detailsId: '9',
    nome: 'Bonito',
    estado: 'MS',
    tipo: 'Rural',
    habitantes: '23 mil habitantes',
    tags: ['Ecoturismo', 'Natureza', 'Aventura'],
    latitude: -21.1261,
    longitude: -56.4836,
    imagemUrl: 'https://picsum.photos/seed/Bonito/240/160',
  },
  {
    id: '4',
    detailsId: '4',
    nome: 'Ouro Preto',
    estado: 'MG',
    tipo: 'Rural',
    habitantes: '75 mil habitantes',
    tags: ['Historico', 'Cultura', 'Serra'],
    latitude: -20.3856,
    longitude: -43.5035,
    imagemUrl: 'https://picsum.photos/seed/OuroPreto/240/160',
  },
  {
    id: '6',
    detailsId: '6',
    nome: 'Sao Paulo',
    estado: 'SP',
    tipo: 'Urbano',
    habitantes: '11.4 mi habitantes',
    tags: ['Urbano', 'Gastronomia', 'Negocios'],
    latitude: -23.5558,
    longitude: -46.6396,
    imagemUrl: 'https://picsum.photos/seed/SaoPaulo/240/160',
  },
  {
    id: '1',
    detailsId: '1',
    nome: 'Florianopolis',
    estado: 'SC',
    tipo: 'Urbano',
    habitantes: '537 mil habitantes',
    tags: ['Praia', 'Natureza', 'Sul'],
    latitude: -27.5949,
    longitude: -48.5482,
    imagemUrl: 'https://picsum.photos/seed/Florianopolis/240/160',
  },
  {
    id: '3',
    detailsId: '3',
    nome: 'Gramado',
    estado: 'RS',
    tipo: 'Rural',
    habitantes: '41 mil habitantes',
    tags: ['Serra', 'Frio', 'Gastronomia'],
    latitude: -29.3734,
    longitude: -50.8762,
    imagemUrl: 'https://picsum.photos/seed/Gramado/240/160',
  },
  {
    id: '7',
    detailsId: '7',
    nome: 'Manaus',
    estado: 'AM',
    tipo: 'Populoso',
    habitantes: '2.1 mi habitantes',
    tags: ['Amazonia', 'Natureza', 'Cultura'],
    latitude: -3.119,
    longitude: -60.0217,
    imagemUrl: 'https://picsum.photos/seed/Manaus/240/160',
  },
  {
    id: 'rio-janeiro',
    nome: 'Rio de Janeiro',
    estado: 'RJ',
    tipo: 'Populoso',
    habitantes: '6.2 mi habitantes',
    tags: ['Praia', 'Cultura', 'Turismo'],
    latitude: -22.9068,
    longitude: -43.1729,
    imagemUrl: 'https://picsum.photos/seed/RioDeJaneiro/240/160',
  },
  {
    id: 'brasilia',
    nome: 'Brasilia',
    estado: 'DF',
    tipo: 'Urbano',
    habitantes: '2.8 mi habitantes',
    tags: ['Arquitetura', 'Capital', 'Urbano'],
    latitude: -15.7939,
    longitude: -47.8828,
    imagemUrl: 'https://picsum.photos/seed/Brasilia/240/160',
  },
  {
    id: 'belo-horizonte',
    nome: 'Belo Horizonte',
    estado: 'MG',
    tipo: 'Urbano',
    habitantes: '2.3 mi habitantes',
    tags: ['Gastronomia', 'Cultura', 'Urbano'],
    latitude: -19.9167,
    longitude: -43.9345,
    imagemUrl: 'https://picsum.photos/seed/BeloHorizonte/240/160',
  },
  {
    id: 'curitiba',
    nome: 'Curitiba',
    estado: 'PR',
    tipo: 'Urbano',
    habitantes: '1.8 mi habitantes',
    tags: ['Parques', 'Urbano', 'Sul'],
    latitude: -25.4284,
    longitude: -49.2733,
    imagemUrl: 'https://picsum.photos/seed/Curitiba/240/160',
  },
  {
    id: 'porto-alegre',
    nome: 'Porto Alegre',
    estado: 'RS',
    tipo: 'Urbano',
    habitantes: '1.3 mi habitantes',
    tags: ['Sul', 'Cultura', 'Lago'],
    latitude: -30.0346,
    longitude: -51.2177,
    imagemUrl: 'https://picsum.photos/seed/PortoAlegre/240/160',
  },
  {
    id: 'belem',
    nome: 'Belem',
    estado: 'PA',
    tipo: 'Populoso',
    habitantes: '1.3 mi habitantes',
    tags: ['Amazonia', 'Gastronomia', 'Historico'],
    latitude: -1.4558,
    longitude: -48.5039,
    imagemUrl: 'https://picsum.photos/seed/Belem/240/160',
  },
  {
    id: 'natal',
    nome: 'Natal',
    estado: 'RN',
    tipo: 'Urbano',
    habitantes: '751 mil habitantes',
    tags: ['Praia', 'Dunas', 'Nordeste'],
    latitude: -5.7793,
    longitude: -35.2009,
    imagemUrl: 'https://picsum.photos/seed/Natal/240/160',
  },
  {
    id: 'joao-pessoa',
    nome: 'Joao Pessoa',
    estado: 'PB',
    tipo: 'Urbano',
    habitantes: '833 mil habitantes',
    tags: ['Praia', 'Historico', 'Nordeste'],
    latitude: -7.1195,
    longitude: -34.845,
    imagemUrl: 'https://picsum.photos/seed/JoaoPessoa/240/160',
  },
  {
    id: 'maceio',
    nome: 'Maceio',
    estado: 'AL',
    tipo: 'Urbano',
    habitantes: '957 mil habitantes',
    tags: ['Praia', 'Lagoas', 'Nordeste'],
    latitude: -9.6498,
    longitude: -35.7089,
    imagemUrl: 'https://picsum.photos/seed/Maceio/240/160',
  },
];

const INITIAL_REGION: Region = {
  latitude: -14.235,
  longitude: -51.9253,
  latitudeDelta: 32,
  longitudeDelta: 32,
};

function regionForCity(city: MapCity): Region {
  return {
    latitude: city.latitude,
    longitude: city.longitude,
    latitudeDelta: 0.18,
    longitudeDelta: 0.18,
  };
}

export default function MapaScreen() {
  const router = useRouter();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const [filtroAtivo, setFiltroAtivo] = useState('Todas');
  const [busca, setBusca] = useState('');
  const [selectedCity, setSelectedCity] = useState<MapCity>(MAP_CITIES[0]);

  const cidadesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return MAP_CITIES.filter((cidade) => {
      const matchesFiltro = filtroAtivo === 'Todas' || cidade.tipo === filtroAtivo;
      const matchesBusca =
        !termo ||
        cidade.nome.toLowerCase().includes(termo) ||
        cidade.estado.toLowerCase().includes(termo) ||
        cidade.tags.some((tag) => tag.toLowerCase().includes(termo));

      return matchesFiltro && matchesBusca;
    });
  }, [busca, filtroAtivo]);

  function focusCity(city: MapCity) {
    setSelectedCity(city);
    mapRef.current?.animateToRegion(regionForCity(city), 450);
  }

  function handleSearchChange(value: string) {
    setBusca(value);
    const firstMatch = MAP_CITIES.find((cidade) =>
      cidade.nome.toLowerCase().includes(value.trim().toLowerCase()),
    );
    if (value.trim() && firstMatch) focusCity(firstMatch);
  }

  function handleDetailsPress() {
    if (!selectedCity.detailsId) return;
    router.push({ pathname: '/detalhes-cidade', params: { id: selectedCity.detailsId } });
  }

  return (
    <MainTabLayout activeTab="mapa">
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.topBar, { paddingTop: r.scaleY(8) }]}>
          <Text style={[styles.mapHeaderTitle, { fontSize: r.font(16) }]}>Explorar Mapa</Text>
          <View style={styles.searchBar}>
            <TextInput
              style={[styles.searchInput, { fontSize: r.font(14) }]}
              placeholder="Encontre novas cidades..."
              placeholderTextColor={Colors.textGray}
              value={busca}
              onChangeText={handleSearchChange}
            />
            <TouchableOpacity style={styles.locationBtn} onPress={() => focusCity(selectedCity)}>
              <MaterialIcons name="my-location" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.filters}>
            {FILTER_TIPOS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, filtroAtivo === f && styles.filterChipActive]}
                onPress={() => setFiltroAtivo(f)}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={f === 'Todas' ? 'public' : f === 'Urbano' ? 'location-city' : f === 'Rural' ? 'eco' : 'people'}
                  size={15}
                  color={filtroAtivo === f ? Colors.primary : Colors.textGray}
                />
                <Text style={[styles.filterText, { fontSize: r.font(13) }, filtroAtivo === f && styles.filterTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.mapArea}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={INITIAL_REGION}
            showsCompass
            showsScale
            toolbarEnabled={false}
          >
            {cidadesFiltradas.map((cidade) => {
              const active = selectedCity.id === cidade.id;
              return (
                <Marker
                  key={cidade.id}
                  coordinate={{ latitude: cidade.latitude, longitude: cidade.longitude }}
                  title={`${cidade.nome}, ${cidade.estado}`}
                  description={cidade.tags.join(' - ')}
                  onPress={() => focusCity(cidade)}
                >
                  <View style={[styles.marker, active && styles.markerActive]}>
                    <MaterialIcons name="place" size={active ? 30 : 24} color="#FFFFFF" />
                  </View>
                </Marker>
              );
            })}
          </MapView>

          <TouchableOpacity style={styles.filterFab} onPress={() => setFiltroAtivo('Todas')}>
            <MaterialIcons name="filter-list-off" size={22} color={Colors.textGray} />
          </TouchableOpacity>
        </View>

        <View style={[styles.cityCard, { paddingBottom: insets.bottom + 12 }]}>
          <Image source={{ uri: selectedCity.imagemUrl }} style={styles.cityCardImg} />
          <View style={styles.cityCardBody}>
            <View style={styles.cityCardTop}>
              <MaterialIcons name="place" size={16} color="#FFFFFF" />
              <Text style={[styles.cityCardNome, { fontSize: r.font(20) }]}>{selectedCity.nome}</Text>
              <Text style={[styles.cityCardEstado, { fontSize: r.font(14) }]}>{selectedCity.estado}</Text>
            </View>
            <Text style={[styles.cityCardPop, { fontSize: r.font(13) }]}>{selectedCity.habitantes}</Text>
            <View style={styles.cityCardTags}>
              {selectedCity.tags.slice(0, 3).map((tag, index) => (
                <View key={tag} style={[styles.tagChip, index === 1 && { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.playBtn, !selectedCity.detailsId && { opacity: 0.45 }]}
                onPress={handleDetailsPress}
                disabled={!selectedCity.detailsId}
              >
                <MaterialIcons name="arrow-forward" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </MainTabLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F0' },
  mapHeaderTitle: { color: Colors.textDark, fontWeight: '700', marginBottom: 10 },
  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: { flex: 1, color: Colors.textDark },
  locationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: { borderColor: Colors.primary },
  filterText: { color: Colors.textGray },
  filterTextActive: { color: Colors.primary, fontWeight: '600' },
  mapArea: { flex: 1, backgroundColor: '#DDE5EE', position: 'relative' },
  marker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  markerActive: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
  },
  filterFab: {
    position: 'absolute',
    right: 16,
    bottom: 22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  cityCard: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  cityCardImg: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cityCardBody: { flex: 1 },
  cityCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cityCardNome: { color: '#FFFFFF', fontWeight: '700' },
  cityCardEstado: { color: 'rgba(255,255,255,0.75)' },
  cityCardPop: { color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  cityCardTags: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  tagChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagChipText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});

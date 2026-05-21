import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useResponsive } from '../../utils/responsive';
import { useAuth } from '../../context/AuthContext';

type InfoRowProps = { label: string; value: string };
function InfoRow({ label, value }: InfoRowProps) {
  const r = useResponsive();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { fontSize: r.font(16) }]}>{label}</Text>
      <Text style={[styles.infoValue, { fontSize: r.font(15) }]}>{value}</Text>
    </View>
  );
}

export default function MeuPerfilScreen() {
  const router = useRouter();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const requisitos = userData?.requisitos || ['Média', '1-3 dias'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: r.scaleY(8) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: r.font(20) }]}>Meu Perfil</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            {userData?.avatarUrl ? (
              <Image source={{ uri: userData.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <MaterialIcons name="person" size={r.scaleX(56)} color={Colors.textWhite} />
            )}
          </View>
        </View>

        {/* Name */}
        <Text style={[styles.name, { fontSize: r.font(24) }]}>{userData?.nome || 'Usuário'}</Text>

        {/* Edit button */}
        <TouchableOpacity style={styles.editBtn} activeOpacity={0.8} onPress={() => router.push('/perfil/editar-perfil')}>
          <MaterialIcons name="edit" size={18} color={Colors.primary} />
          <Text style={[styles.editBtnText, { fontSize: r.font(14) }]}>Editar Perfil</Text>
        </TouchableOpacity>

        {/* Info fields */}
        <View style={styles.infoContainer}>
          <InfoRow label="Email" value={userData?.email || 'N/A'} />
          <InfoRow label="Nome de Usuário" value={userData?.nome || 'N/A'} />
          <InfoRow label="Telefone" value={userData?.telefone || 'Não informado'} />
          <InfoRow label="Data de Nascimento" value={userData?.dataNascimento || 'Não informado'} />
          <InfoRow label="Senha" value="*********" />
        </View>

        {/* Requisitos */}
        <View style={styles.requisitosHeader}>
          <Text style={[styles.requisitosTitle, { fontSize: r.font(18) }]}>Meus Requisitos</Text>
          <TouchableOpacity style={styles.editSmallBtn} activeOpacity={0.8} onPress={() => router.push('/perfil/preferencias')}>
            <MaterialIcons name="edit" size={15} color={Colors.textGray} />
            <Text style={[styles.editSmallText, { fontSize: r.font(12) }]}>EDITAR</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tagsRow}>
          {requisitos.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={[styles.tagText, { fontSize: r.font(14) }]}>{tag}</Text>
            </View>
          ))}
        </View>
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
    paddingBottom: 16,
  },
  backBtn: { marginRight: 12 },
  headerTitle: { color: Colors.textWhite, fontWeight: '700' },
  content: { paddingHorizontal: 24, paddingTop: 8, alignItems: 'center' },
  avatarWrapper: { marginBottom: 16, alignItems: 'center' },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(121,116,231,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  name: { color: Colors.textWhite, fontWeight: '700', marginBottom: 12 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginBottom: 28,
  },
  editBtnText: { color: Colors.primary },
  infoContainer: { alignSelf: 'stretch' },
  infoRow: { marginBottom: 16 },
  infoLabel: { color: Colors.textWhite, fontWeight: '700' },
  infoValue: { color: Colors.textWhite, opacity: 0.75, marginTop: 2 },
  requisitosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 8,
    marginBottom: 12,
  },
  requisitosTitle: { color: Colors.textWhite, fontWeight: '700' },
  editSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editSmallText: { color: Colors.textGray },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignSelf: 'stretch' },
  tag: {
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
  },
  tagText: { color: Colors.textDark, fontWeight: '600' },
});

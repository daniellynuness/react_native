import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import StarRating from '../../components/ui/StarRating';
import { Colors } from '../../constants/Colors';
import { Avaliacao } from '../../data/mockAvaliacoes';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../utils/responsive';

export default function AvaliacoesScreen() {
  const router = useRouter();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { userData } = useAuth();

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [novaNota, setNovaNota] = useState(1);
  const [novaCidade, setNovaCidade] = useState('');
  const [novoEstado, setNovoEstado] = useState('');
  const [novoComentario, setNovoComentario] = useState('');
  const [novaPublica, setNovaPublica] = useState(true);

  const totalDestinos = avaliacoes.length;
  const mediaNotas =
    totalDestinos > 0
      ? (avaliacoes.reduce((s, a) => s + a.nota, 0) / totalDestinos).toFixed(1)
      : '0.0';

  function resetForm() {
    setNovaCidade('');
    setNovoEstado('');
    setNovoComentario('');
    setNovaNota(1);
    setNovaPublica(true);
  }

  function closeModal() {
    Keyboard.dismiss();
    setModalVisible(false);
  }

  function handleAddAvaliacao() {
    if (!novaCidade.trim()) return;
    const nova: Avaliacao = {
      id: Date.now().toString(),
      cidadeNome: novaCidade.trim(),
      cidadeEstado: novoEstado.trim().toUpperCase(),
      nota: novaNota,
      data: new Date().toLocaleDateString('pt-BR'),
      comentario: novoComentario.trim(),
      publica: novaPublica,
    };
    setAvaliacoes((prev) => [nova, ...prev]);
    resetForm();
    closeModal();
  }

  function handleDelete(id: string) {
    setAvaliacoes((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: r.scaleY(8) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: r.font(20) }]}>Minhas Avaliações</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.userName, { fontSize: r.font(20) }]}>{userData?.nome ?? 'Usuário'}</Text>
        <View style={styles.divider} />
        <Text style={[styles.stat, { fontSize: r.font(15) }]}>
          <Text style={styles.statHighlight}>• {totalDestinos} destinos avaliados</Text>
        </Text>
        <View style={styles.statRow}>
          <Text style={[styles.statHighlight, { fontSize: r.font(15) }]}>• média de {mediaNotas}</Text>
          <MaterialIcons name="star" size={16} color="#F59E0B" style={{ marginLeft: 4 }} />
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setModalVisible(true)}>
              <MaterialIcons name="add" size={22} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, styles.iconBtnFilled]} onPress={() => setEditMode((v) => !v)}>
              <MaterialIcons name="edit" size={18} color={Colors.textWhite} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.divider} />

        {avaliacoes.length > 0 ? (
          avaliacoes.map((av) => (
            <View key={av.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <MaterialIcons name="place" size={18} color={Colors.textWhite} />
                  <Text style={[styles.cardCidade, { fontSize: r.font(16) }]}>
                    {av.cidadeNome}, {av.cidadeEstado}
                  </Text>
                </View>
              </View>
              <View style={styles.cardStarRow}>
                <StarRating value={av.nota} size={18} />
                <Text style={[styles.cardData, { fontSize: r.font(12) }]}>{av.data}</Text>
              </View>
              <View style={styles.cardDivider} />
              {av.comentario ? (
                <Text style={[styles.cardComentario, { fontSize: r.font(13) }]}>{av.comentario}</Text>
              ) : null}
              {editMode && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(av.id)}>
                  <MaterialIcons name="delete" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="star-border" size={42} color={Colors.textGray} />
            <Text style={[styles.emptyTitle, { fontSize: r.font(18) }]}>Nenhuma avaliação sua ainda</Text>
            <Text style={[styles.emptyText, { fontSize: r.font(14) }]}>
              As avaliações de outros usuários aparecem apenas nas telas das cidades.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: r.font(18) }]}>Nova avaliação</Text>
                <Pressable style={styles.closeBtn} onPress={closeModal}>
                  <MaterialIcons name="close" size={22} color={Colors.textDark} />
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalLabel, { fontSize: r.font(16) }]}>Avaliação:</Text>
                <StarRating value={novaNota} size={28} onPress={setNovaNota} />

                <Text style={[styles.modalLabel, { fontSize: r.font(16), marginTop: 14 }]}>Local:</Text>
                <View style={styles.modalRow}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Cidade"
                    placeholderTextColor={Colors.textGray}
                    value={novaCidade}
                    onChangeText={setNovaCidade}
                    returnKeyType="next"
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="UF"
                    placeholderTextColor={Colors.textGray}
                    value={novoEstado}
                    onChangeText={(value) => setNovoEstado(value.toUpperCase())}
                    returnKeyType="next"
                    autoCapitalize="characters"
                    maxLength={2}
                  />
                </View>

                <Text style={[styles.modalLabel, { fontSize: r.font(16), marginTop: 12 }]}>
                  Classificação detalhada:
                </Text>
                <TextInput
                  style={styles.modalTextArea}
                  placeholder="Até 200 caracteres..."
                  placeholderTextColor={Colors.textGray}
                  multiline
                  maxLength={200}
                  value={novoComentario}
                  onChangeText={setNovoComentario}
                  returnKeyType="done"
                  blurOnSubmit
                />

                <View style={styles.modalFooter}>
                  <View style={styles.switchRow}>
                    <Switch
                      value={novaPublica}
                      onValueChange={setNovaPublica}
                      trackColor={{ true: Colors.primary, false: Colors.textGray }}
                    />
                    <Text style={[styles.switchLabel, { fontSize: r.font(14) }]}>Público</Text>
                  </View>
                  <View style={styles.modalActions}>
                    <Pressable style={styles.cancelBtn} onPress={closeModal}>
                      <Text style={[styles.cancelText, { fontSize: r.font(14) }]}>CANCELAR</Text>
                    </Pressable>
                    <Pressable style={styles.enviarBtn} onPress={handleAddAvaliacao}>
                      <Text style={[styles.enviarText, { fontSize: r.font(14) }]}>ENVIAR</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
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
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  userName: { color: Colors.textWhite, fontWeight: '700', marginBottom: 6 },
  divider: { height: 1, backgroundColor: '#3F3F8A', marginVertical: 8 },
  stat: { color: Colors.textWhite },
  statHighlight: { color: '#F59E0B', fontWeight: '600' },
  statRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  actionButtons: { flexDirection: 'row', marginLeft: 'auto', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnFilled: { backgroundColor: '#3D3D8E' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardCidade: { color: Colors.textWhite, fontWeight: '700' },
  cardStarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  cardData: { color: Colors.textGray },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 10 },
  cardComentario: { color: Colors.textWhite },
  deleteBtn: { position: 'absolute', right: 12, bottom: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 72 },
  emptyTitle: { color: Colors.textWhite, fontWeight: '800', marginTop: 12 },
  emptyText: { color: Colors.textGray, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 8,
    maxHeight: '82%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: Colors.textDark, fontWeight: '800' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLabel: { color: Colors.textDark, fontWeight: '700' },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalInput: {
    flex: 1,
    minWidth: 80,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: Colors.textDark,
  },
  modalTextArea: {
    height: 100,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingTop: 10,
    color: Colors.textDark,
    textAlignVertical: 'top',
  },
  modalFooter: { gap: 12, marginTop: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { color: Colors.textDark },
  modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  cancelBtn: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelText: { color: Colors.textDark, fontWeight: '700' },
  enviarBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  enviarText: { color: Colors.textWhite, fontWeight: '700' },
});

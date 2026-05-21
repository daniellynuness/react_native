import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Cidade } from '../data/mockCidades';
import { Roteiro } from '../data/mockRoteiros';
import { db } from './firebase';

export type UserRoteiro = Roteiro & {
  uid: string;
  automatico?: boolean;
  observacoes?: string;
  cidadeIds?: string[];
  autorNome?: string;
  descricao?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function cidadeLabel(cidade: Cidade) {
  return `${cidade.nome}, ${cidade.estado}`;
}

function calcularDuracao(totalCidades: number) {
  if (totalCidades <= 1) return '1 dia';
  if (totalCidades <= 3) return '2-3 dias';
  if (totalCidades <= 6) return '4-7 dias';
  return '7+ dias';
}

function calcularTipo(cidades: Cidade[]) {
  if (cidades.some((cidade) => ['Praia', 'Natureza'].includes(cidade.categoria))) return 'Aventura';
  if (cidades.some((cidade) => ['Cultura', 'Histórico', 'Historico', 'Gastronomia'].includes(cidade.categoria))) {
    return 'Conforto';
  }
  return 'Econômico';
}

function roteiroFromDoc(id: string, data: Record<string, any>): UserRoteiro {
  return {
    id,
    uid: data.uid,
    nome: data.nome ?? 'Roteiro',
    cidades: Array.isArray(data.cidades) ? data.cidades : [],
    cidadeIds: Array.isArray(data.cidadeIds) ? data.cidadeIds : [],
    distanciaKm: Number(data.distanciaKm ?? 0),
    duracao: data.duracao ?? 'A definir',
    tipo: data.tipo ?? 'Personalizado',
    cor: data.cor ?? '#8B5CF6',
    privado: data.privado ?? true,
    favoritado: data.favoritado ?? false,
    imagemUrl: data.imagemUrl,
    automatico: data.automatico,
    observacoes: data.observacoes,
    autorNome: data.autorNome,
    descricao: data.descricao,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function listarRoteirosUsuario(uid: string): Promise<UserRoteiro[]> {
  if (!db) return [];

  const snap = await getDocs(query(collection(db, 'roteiros'), where('uid', '==', uid)));
  return snap.docs.map((docSnap) => roteiroFromDoc(docSnap.id, docSnap.data()));
}

export async function buscarRoteiroUsuario(uid: string, roteiroId: string): Promise<UserRoteiro | null> {
  if (!db) return null;

  const snap = await getDoc(doc(db, 'roteiros', roteiroId));
  if (!snap.exists()) return null;

  const roteiro = roteiroFromDoc(snap.id, snap.data());
  return roteiro.uid === uid ? roteiro : null;
}

export async function criarRoteiroUsuario({
  uid,
  nome,
  cidades,
  cidadeIds,
  duracao,
  tipo,
  clima,
  energia,
  observacoes,
  cor,
  privado,
  automatico = false,
}: {
  uid: string;
  nome: string;
  cidades: string[];
  cidadeIds: string[];
  duracao: string;
  tipo: string;
  clima: string;
  energia: string;
  observacoes?: string;
  cor: string;
  privado: boolean;
  automatico?: boolean;
}) {
  if (!db) throw new Error('Firebase nao configurado.');

  return addDoc(collection(db, 'roteiros'), {
    uid,
    nome,
    cidades,
    cidadeIds,
    distanciaKm: 0,
    duracao,
    tipo,
    clima,
    energia,
    observacoes: observacoes ?? '',
    cor,
    privado,
    automatico,
    favoritado: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function adicionarCidadeAoRoteiroAutomatico(uid: string, cidade: Cidade) {
  if (!db) throw new Error('Firebase nao configurado.');

  const snap = await getDocs(query(collection(db, 'roteiros'), where('uid', '==', uid), limit(50)));
  const roteiros = snap.docs.map((docSnap) => roteiroFromDoc(docSnap.id, docSnap.data()));
  const manual = roteiros.find((roteiro) => !roteiro.automatico);

  if (manual) {
    await updateDoc(doc(db, 'roteiros', manual.id), {
      cidades: arrayUnion(cidadeLabel(cidade)),
      cidadeIds: arrayUnion(cidade.id),
      updatedAt: serverTimestamp(),
    });
    return manual.nome;
  }

  const automatico = roteiros.find((roteiro) => roteiro.automatico);
  if (automatico) {
    const totalCidades = new Set([...(automatico.cidadeIds ?? []), cidade.id]).size;
    await updateDoc(doc(db, 'roteiros', automatico.id), {
      cidades: arrayUnion(cidadeLabel(cidade)),
      cidadeIds: arrayUnion(cidade.id),
      duracao: calcularDuracao(totalCidades),
      updatedAt: serverTimestamp(),
    });
    return automatico.nome;
  }

  await criarRoteiroUsuario({
    uid,
    nome: 'Roteiro 1',
    cidades: [cidadeLabel(cidade)],
    cidadeIds: [cidade.id],
    duracao: '1 dia',
    tipo: calcularTipo([cidade]),
    clima: cidade.categoria === 'Praia' ? 'Ensolarado' : 'Temperado',
    energia: cidade.categoria === 'Histórico' ? 'Calmo' : 'Moderado',
    observacoes: 'Criado automaticamente ao adicionar uma cidade.',
    cor: '#8B5CF6',
    privado: true,
    automatico: true,
  });

  return 'Roteiro 1';
}

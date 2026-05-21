export type Roteiro = {
  id: string;
  nome: string;
  cidades: string[];
  distanciaKm: number;
  duracao: string;
  tipo: string;
  cor: string;
  privado: boolean;
  favoritado: boolean;
  imagemUrl?: string;
  autorNome?: string;
  descricao?: string;
};

export const roteirosFavoritos: Roteiro[] = [
  {
    id: '1',
    nome: 'Praias Nordeste',
    cidades: ['Recife', 'Olinda', 'Ipojuca'],
    distanciaKm: 300,
    duracao: '2-4 dias',
    tipo: 'Verão',
    cor: '#F59E0B',
    privado: false,
    favoritado: true,
    imagemUrl: 'https://picsum.photos/seed/praiaNordeste/120/120',
  },
  {
    id: '2',
    nome: 'Cidades Norte',
    cidades: ['Belém', 'Manaus', 'Boa Vista'],
    distanciaKm: 1000,
    duracao: '5-10 dias',
    tipo: 'Natureza',
    cor: '#10B981',
    privado: true,
    favoritado: true,
    imagemUrl: 'https://picsum.photos/seed/cidadesNorte/120/120',
  },
  {
    id: '3',
    nome: 'Praias Sudeste',
    cidades: ['Rio de Janeiro', 'São Paulo', 'Florianópolis'],
    distanciaKm: 600,
    duracao: '7-14 dias',
    tipo: 'Verão',
    cor: '#EF4444',
    privado: false,
    favoritado: true,
    imagemUrl: 'https://picsum.photos/seed/praiasSudeste/120/120',
  },
];

export const roteirosRecomendados: Roteiro[] = [
  {
    id: '4',
    nome: 'Cidades mais próximas do litoral',
    cidades: ['Fortaleza', 'Natal', 'João Pessoa'],
    distanciaKm: 400,
    duracao: '2-4 dias',
    tipo: 'Verão',
    cor: '#3B82F6',
    privado: false,
    favoritado: true,
    imagemUrl: 'https://picsum.photos/seed/litoral/120/120',
  },
  {
    id: '5',
    nome: 'Para aproveitar o frio',
    cidades: ['Gramado, RS', 'Canela, RS', 'Bento Gonçalves, RS', 'Campos do Jordão, SP', 'Curitiba, PR'],
    distanciaKm: 980,
    duracao: '5-10 dias',
    tipo: 'Inverno',
    cor: '#6366F1',
    privado: false,
    favoritado: false,
    imagemUrl: 'https://picsum.photos/seed/frio/120/120',
    autorNome: 'Marina Alves',
    descricao: 'Roteiro compartilhado pela comunidade com cidades frias, serra, gastronomia e passeios urbanos.',
  },
  {
    id: '6',
    nome: '3 Trilhas para fazer no Brasil',
    cidades: ['Chapada', 'Ibitipoca', 'Abraão'],
    distanciaKm: 900,
    duracao: '20 dias',
    tipo: 'Aventura',
    cor: '#8B5CF6',
    privado: false,
    favoritado: false,
    imagemUrl: 'https://picsum.photos/seed/trilhas/120/120',
  },
  {
    id: '7',
    nome: 'Pontos Turísticos no Rio de Janeiro',
    cidades: ['Rio de Janeiro'],
    distanciaKm: 0,
    duracao: '1-3 dias',
    tipo: 'Passeios',
    cor: '#059669',
    privado: false,
    favoritado: true,
    imagemUrl: 'https://picsum.photos/seed/rioPontos/120/120',
  },
  {
    id: '8',
    nome: 'Cidades da região Sul',
    cidades: ['Florianópolis', 'Curitiba', 'Porto Alegre'],
    distanciaKm: 700,
    duracao: '7-12 dias',
    tipo: 'Cultura',
    cor: '#0891B2',
    privado: false,
    favoritado: false,
    imagemUrl: 'https://picsum.photos/seed/sul/120/120',
  },
];

import { Cidade } from '../data/mockCidades';

/**
 * Calcula a distância entre duas cidades usando a fórmula de Haversine
 */
export function calcularDistanciaKm(
  cidade1: Cidade,
  cidade2: Cidade,
  cityCoords: Record<string, { lat: number; lon: number }>
): number {
  const normalizeName = (nome: string) =>
    nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const coord1 = cityCoords[normalizeName(cidade1.nome)];
  const coord2 = cityCoords[normalizeName(cidade2.nome)];

  if (!coord1 || !coord2) {
    // Fallback: estimar por região/estado
    if (cidade1.estado === cidade2.estado) return 90;
    if (cidade1.regiao === cidade2.regiao) return 280;
    return 950;
  }

  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lon - coord1.lon);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Sugere cidades próximas geograficamente
 */
export function sugerirCidadesPorProximidade(
  ultimaCidade: Cidade,
  todasCidades: Cidade[],
  jaSelecionadas: string[],
  cityCoords: Record<string, { lat: number; lon: number }>,
  limit: number = 3
): Cidade[] {
  const distancias = todasCidades
    .filter((c) => c.id !== ultimaCidade.id && !jaSelecionadas.includes(c.id))
    .map((cidade) => ({
      cidade,
      distancia: calcularDistanciaKm(ultimaCidade, cidade, cityCoords),
    }))
    .sort((a, b) => a.distancia - b.distancia);

  return distancias.slice(0, limit).map((d) => d.cidade);
}

/**
 * Sugere cidades com base no tema/categoria (mesmo tipo de roteiro)
 */
export function sugerirCidadesPorTema(
  roteiroCidades: Cidade[],
  todasCidades: Cidade[],
  jaSelecionadas: string[],
  limit: number = 3
): Cidade[] {
  // Determinar categorias principais do roteiro
  const categoriasPrincipais = new Set(roteiroCidades.map((c) => c.categoria));

  // Sugerir cidades com categorias similares
  const sugestoes = todasCidades
    .filter((c) => !jaSelecionadas.includes(c.id))
    .filter((c) => categoriasPrincipais.has(c.categoria))
    .filter((c) => !roteiroCidades.some((rc) => rc.id === c.id))
    .slice(0, limit);

  return sugestoes;
}

/**
 * Combina sugestões por proximidade e tema
 */
export function sugerirCidades(
  ultimaCidade: Cidade,
  roteiroCidades: Cidade[],
  todasCidades: Cidade[],
  jaSelecionadas: string[],
  cityCoords: Record<string, { lat: number; lon: number }>,
  limit: number = 3
): Cidade[] {
  const porProximidade = sugerirCidadesPorProximidade(
    ultimaCidade,
    todasCidades,
    jaSelecionadas,
    cityCoords,
    Math.ceil(limit / 2)
  );

  const porTema = sugerirCidadesPorTema(roteiroCidades, todasCidades, jaSelecionadas, Math.ceil(limit / 2));

  // Combinar e remover duplicatas
  const combinadas = [...porProximidade, ...porTema];
  const vistas = new Set<string>();
  const resultado: Cidade[] = [];

  for (const cidade of combinadas) {
    if (!vistas.has(cidade.id)) {
      vistas.add(cidade.id);
      resultado.push(cidade);
      if (resultado.length >= limit) break;
    }
  }

  return resultado;
}

import { useMemo, useState } from 'react';
import HomeScreenContent from '../components/home/HomeScreenContent';
import MainTabLayout from '../components/layout/MainTabLayout';
import { Cidade, cidadesRecomendadas, ultimasVisualizadas } from '../data/mockCidades';
import { useAuth } from '../context/AuthContext';
import { rankCitiesByPreferences, UserPreferences } from '../utils/preferences';

const todasCidadesJson = require('../data/cidades.json') as Cidade[];

export default function HomeScreen() {
  const { userData } = useAuth();
  const preferencias = (userData?.preferencias ?? {}) as UserPreferences;
  const recomendadas = useMemo(
    () => rankCitiesByPreferences(cidadesRecomendadas, preferencias),
    [userData?.preferencias],
  );

  const [busca, setBusca] = useState('');
  const [resultadoBusca, setResultadoBusca] = useState<Cidade[] | null>(null);

  function handleBusca() {
    const termo = busca.trim().toLowerCase();
    if (!termo) {
      setResultadoBusca(null);
      return;
    }
    setResultadoBusca(
      todasCidadesJson.filter((c) => c.nome.toLowerCase().includes(termo)),
    );
  }

  return (
    <MainTabLayout activeTab="explorar">
      <HomeScreenContent
        busca={busca}
        resultadoBusca={resultadoBusca}
        recomendadas={recomendadas}
        ultimas={ultimasVisualizadas}
        onChangeBusca={(t) => {
          setBusca(t);
          if (!t.trim()) setResultadoBusca(null);
        }}
        onSubmitBusca={handleBusca}
      />
    </MainTabLayout>
  );
}

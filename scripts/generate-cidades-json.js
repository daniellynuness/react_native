const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const csvPath = path.resolve(__dirname, '../assets/data/BRAZIL_CITIES.csv');
const jsonPath = path.resolve(__dirname, '../src/data/cidades.json');

const csvText = fs.readFileSync(csvPath, 'utf8');
const parsed = Papa.parse(csvText, {
  delimiter: ';',
  header: true,
  skipEmptyLines: true,
});

const stateToRegion = {
  AC: 'Norte', AM: 'Norte', AP: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  MA: 'Nordeste', PI: 'Nordeste', CE: 'Nordeste', RN: 'Nordeste', PB: 'Nordeste', PE: 'Nordeste', AL: 'Nordeste', SE: 'Nordeste', BA: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste',
  SP: 'Sudeste', RJ: 'Sudeste', MG: 'Sudeste', ES: 'Sudeste',
  PR: 'Sul', SC: 'Sul', RS: 'Sul',
};

const cities = parsed.data
  .filter((row) => row.CITY && row.STATE)
  .map((row, index) => {
    const nome = String(row.CITY).trim();
    const estado = String(row.STATE).trim();
    const regiao = stateToRegion[estado] ?? 'Outros';
    return {
      id: String(index + 1),
      nome,
      estado,
      regiao,
      avaliacao: 4.5,
      categoria: 'Cultura',
      imagemUrl: `https://picsum.photos/seed/${encodeURIComponent(nome)}/300/200`,
    };
  });

fs.writeFileSync(jsonPath, JSON.stringify(cities, null, 2), 'utf8');
console.log(`Generated ${cities.length} cities to ${jsonPath}`);

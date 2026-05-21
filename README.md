# Brasil em Foco

Prototipo desenvolvido para as disciplinas de PISI 3 e DSI da UFRPE.

Este guia explica como rodar o app no celular usando Expo Go e como deixar o Firebase funcionando para login, perfil, preferencias e roteiros.

## Pre-requisitos

1. Git instalado
2. Node.js LTS, recomendado Node 20.x
3. npm, que ja vem com o Node
4. Expo Go instalado no celular
   - iOS: App Store
   - Android: Play Store
5. Computador e celular na mesma rede Wi-Fi

## Como baixar o projeto

Clone o repositorio ou o fork:

```bash
git clone URL_DO_SEU_FORK
cd NOME_DA_PASTA_DO_PROJETO
```

Instale as dependencias:

```bash
npm install
```

## Configurar Firebase

O app usa Firebase para autenticar usuarios e salvar dados como:

- nome e e-mail do usuario
- telefone, data de nascimento e foto do perfil
- preferencias de viagem
- roteiros criados automaticamente ou manualmente
- roteiros recomendados salvos pelo usuario

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell, se o comando acima nao funcionar, use:

```powershell
Copy-Item .env.example .env
```

O `.env.example` ja esta preenchido com a configuracao publica do projeto Firebase usado pela equipe. Nao coloque chave admin no app.

Importante:

- O arquivo `.env` nao deve ser enviado ao GitHub.
- O arquivo `*-firebase-adminsdk-*.json` tambem nao deve ser enviado ao GitHub.
- A chave admin e usada apenas por quem administra o Firebase, nunca dentro do app mobile.

## Como rodar no celular com Expo Go

Suba o servidor Expo:

```bash
npx expo start --clear
```

Depois:

1. Abra o Expo Go no celular.
2. Escaneie o QR code exibido no terminal.
3. Aguarde o app carregar.

Se estiver no iPhone, tambem pode escanear o QR pela camera do iOS e abrir no Expo Go.

## Se o celular nao conectar

Confira estes pontos:

- Computador e celular precisam estar na mesma rede Wi-Fi.
- Evite VPN ligada no computador ou celular.
- Se o computador estiver no cabo e o celular no Wi-Fi, pode falhar dependendo da rede.
- Se aparecer erro de conexao, feche o Expo Go e rode novamente:

```bash
npx expo start --clear
```

Se ainda nao conectar, rode em modo tunnel:

```bash
npx expo start --tunnel
```

O modo tunnel costuma ser mais lento, mas funciona melhor quando a rede bloqueia conexoes locais.

## Scripts uteis

```bash
npm run start   # Inicia o projeto com Expo
npm run android # Abre no Android, se houver emulador configurado
npm run ios     # Abre no iOS, se estiver em ambiente compatível
npm run web     # Abre no navegador
```

## Funcionalidades integradas ao Firebase

Depois de fazer login, o app cria ou atualiza automaticamente o documento do usuario em:

```text
usuarios/{uid}
```

Campos salvos atualmente:

```text
nome
email
telefone
dataNascimento
avatarUrl
preferencias
requisitos
roteirosSalvos
preferenciasConcluidas
```

Roteiros criados pelo usuario sao salvos em:

```text
roteiros/{roteiroId}
```

Cada roteiro tem o `uid` do usuario dono. As regras do Firestore devem permitir que cada usuario leia e escreva apenas seus proprios dados.

## Mapa

A tela de mapa usa `react-native-maps` e roda no Expo Go. No ambiente de desenvolvimento, basta instalar as dependencias e abrir pelo Expo Go.

Para build final publicado, pode ser necessario configurar chaves do Google Maps no `app.json`/config plugin, dependendo da plataforma e do tipo de build.

## Estrutura do projeto

```text
assets/                 imagens, icones e dados auxiliares
src/app/                rotas e telas do Expo Router
src/components/         componentes reutilizaveis
src/context/            contextos globais, como AuthContext
src/constants/          cores, tokens e constantes visuais
src/data/               dados mockados usados na demo
src/services/           Firebase, roteiros, usuarios e APIs externas
src/theme/              temas visuais
src/types/              tipos TypeScript
src/utils/              funcoes utilitarias
```

## Cuidados ao contribuir

- Nao envie `.env` para o GitHub.
- Nao envie chave admin do Firebase.
- Antes de subir mudancas, rode:

```bash
npx tsc --noEmit
```

- Ao alterar dependencias nativas do Expo, avise a equipe para rodar:

```bash
npm install
npx expo start --clear
```

## Troubleshooting rapido

### Erro: package.json nao encontrado

Voce provavelmente esta fora da pasta do projeto.

Entre na pasta correta:

```bash
cd NOME_DA_PASTA_DO_PROJETO
```

### Erro: variaveis Firebase ausentes

Confira se existe um arquivo `.env` na raiz do projeto.

Se nao existir:

```bash
cp .env.example .env
```

Depois reinicie:

```bash
npx expo start --clear
```

### Login funciona, mas dados nao salvam

Verifique:

- se o `.env` foi criado
- se o Expo foi reiniciado depois de criar o `.env`
- se as regras do Firestore estao publicadas
- se o usuario esta realmente logado

## Versoes principais

- Expo: `~54.0.34`
- Expo Router: `~6.0.23`
- React: `19.1.0`
- React Native: `0.81.5`
- Firebase: `^12.13.0`

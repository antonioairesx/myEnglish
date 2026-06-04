# Recall — PWA de repetição espaçada com áudio

Flashcards com algoritmo SM-2 (mesma base do Anki), TTS por idioma, plan mode e progresso.
React + Vite + TypeScript + Tailwind + Firebase (Auth + Firestore) + PWA.

## Passo a passo (sem terminal, tudo via web)

### 1. Firebase (5 min)
1. Acesse console.firebase.google.com e crie um projeto.
2. No menu lateral: Authentication > Comecar > aba "Sign-in method" > ative "Google".
3. Menu: Firestore Database > Criar banco de dados > modo de producao > regiao southamerica-east1.
4. Na aba "Regras" do Firestore, cole o conteudo do arquivo `firestore.rules` deste projeto e publique.
5. Engrenagem (Configuracoes do projeto) > role ate "Seus apps" > icone web (</>) > registre o app.
6. Copie os valores do objeto `firebaseConfig` que aparecer. Voce vai usar no passo 3.

### 2. GitHub
1. Crie um repositorio novo (pode ser privado).
2. "Add file" > "Upload files" > arraste TODOS os arquivos e pastas deste projeto (menos node_modules e dist).
3. Commit.

### 3. Vercel
1. vercel.com > Add New > Project > importe o repositorio.
2. Framework: Vite (detecta sozinho). Build: `npm run build`. Output: `dist`.
3. Em "Environment Variables", adicione as 6 chaves (valores do passo 1.6):
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_AUTH_DOMAIN
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_STORAGE_BUCKET
   - VITE_FIREBASE_MESSAGING_SENDER_ID
   - VITE_FIREBASE_APP_ID
4. Deploy.

### 4. Autorizar o dominio no Firebase
Depois do deploy, copie a URL da Vercel e adicione em:
Firebase > Authentication > Settings > "Dominios autorizados" > Adicionar dominio.
Sem isso o login com Google falha.

### 5. Instalar como app
Abra a URL no celular ou Mac > menu do navegador > "Instalar app" / "Adicionar a tela inicial".

## Para compartilhar com amigos/familia
Cada pessoa entra com o proprio Google. Os dados ficam isolados por usuario
(users/{uid}/...), garantido pelas Security Rules. Nada de configuracao extra.

## Estrutura
- `src/lib/sm2.ts` — algoritmo de repeticao espacada
- `src/lib/store.ts` — acesso ao Firestore (multi-user)
- `src/lib/firebase.ts` — config + cache offline persistente
- `src/contexts/` — Auth e Data (estado global em tempo real)
- `src/screens/` — telas (Login, Plan, Decks, DeckDetail, Study, Stats)
- `firestore.rules` — regras de seguranca (colar no Console)

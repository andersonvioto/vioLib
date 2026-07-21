# 📚 vioLib - Gestão Inteligente de Biblioteca Pessoal

A vioLib é uma aplicação Full-Stack (PWA) desenvolvida para a gestão moderna, categorização e acompanhamento de leitura de acervos bibliográficos pessoais. Concebida com uma arquitetura Offline-First, garante que o utilizador possa gerir, editar e pesquisar a sua biblioteca a partir de qualquer dispositivo, mesmo sem acesso à internet.

## ✨ Funcionalidades Principais

- **📲 Progressive Web App (PWA) & Offline-First:** Motor de sincronização robusto que utiliza IndexedDB e Workbox. Permite consultar, pesquisar, editar e excluir livros totalmente offline. Quando a ligação é restabelecida, a "Caixa de Saída" (Outbox) sincroniza automaticamente com o servidor (Estratégia Optimistic UI / Last Write Wins).
- **🔍 Leitor de Código de Barras (ISBN):** Integração nativa com a câmara do telemóvel para leitura de ISBN e preenchimento automático de metadados via APIs externas.
- **📸 Integração com Cloudinary:** Processamento, corte (Cropper) e compressão de capas de livros no cliente antes do upload, com armazenamento gerido profissionalmente na nuvem pela API do Cloudinary.
- **🤝 Compartilhamento de Bibliotecas:** Sistema de acessos e permissões que permite convidar amigos para visualizar o seu acervo.
- **🏆 Módulo de Coleções (Gamificação):** Criação de "Álbuns" dinâmicos com eixos personalizados de categorização e barras de progresso interativas.
- **🎓 Gerador de Citações:** Motor interno para geração automática de citações bibliográficas (ABNT, APA, MLA, Vancouver, Chicago).

## 🧩 Ecossistema: A Extensão de Navegador

A vioLib possui uma Extensão de Navegador Oficial (Chrome / Firefox) projetada para contornar bloqueios de bots e sistemas anti-scraping de grandes retalhistas.

- \*\_🔗 Repositório da Extensão: [/andersonvioto/violib-extension](https://github.com/andersonvioto/violib-extension)

### Como funciona a integração?

1. O utilizador faz login na extensão, que armazena localmente o token JWT.
2. Ao navegar numa página de livro da Amazon, a extensão (via Content Script) realiza a extração do DOM (Título, Autor, Capa, ISBN, Editora, Ano).
3. Com um clique, a extensão envia um pacote JSON diretamente para a nossa API REST (POST /api/books), fazendo o livro surgir instantaneamente na biblioteca.

## 🏗 Arquitetura do Sistema

O projeto adota uma arquitetura separada em duas camadas lógicas principais no mesmo repositório:

- **Frontend (Cliente):**
  - **React + Vite:** Interface responsiva com PWA configurado via vite-plugin-pwa.
  - **Axios + IndexedDB:** Motor de requisições que atua como um "Mini-Servidor Local" (Busca, Filtros e Paginação) quando a rede falha.
- **Backend (Servidor):**
  - **Node.js + Express:** API RESTful.
  - **Sequelize (ORM) + Oracle Cloud (ADB):** Banco de dados relacional hospedado na nuvem, acessado via Wallet de segurança.
  - **Google OAuth2 (Nodemailer):** Envio de e-mails transacionais utilizando Refresh Tokens para evitar bloqueios de segurança do Google.
  - **JWT (JSON Web Tokens):** Autenticação stateless.

## 🚀 Como Executar o Projeto Localmente

Siga os passos abaixo para configurar o ambiente de desenvolvimento.

### Pré-requisitos

- Node.js (Versão 18 ou superior)
- Conta na Oracle Cloud (Banco de Dados ADB) e a sua respetiva Wallet descompactada.
- Conta no Cloudinary (Para as imagens).
- Credenciais do Google Cloud Console (OAuth2 para e-mail e Login).

### 1. Clonar o Repositório

```
git clone https://github.com/andersonvioto/violib.git
cd violib
```

### 2. Configurar o Backend e o Banco de Dados (Oracle Wallet)

```
cd backend
npm install
```

Crie a pasta para a Wallet do Oracle e coloque lá os seus ficheiros (cwallet.sso, tnsnames.ora, etc.):

```
mkdir -p src/config/wallet
```

Crie um arquivo .env na pasta backend/ com base na estrutura abaixo:

```
# Configurações do Banco de Dados (Oracle ADB)
PORT=3000
DB_USER=seu_usuario_banco
DB_PASSWORD=sua_senha_banco
DB_CONNECTION_STRING="(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=seu_host_oracle.oraclecloud.com))(connect_data=(service_name=seu_service_name.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))"
DB_DIALECT=oracle
DB_WALLET_LOCATION=./src/config/wallet
DB_WALLET_PASSWORD=sua_senha_da_wallet
JWT_SECRET=sua_chave_secreta_jwt

# Configurações do Google (OAuth2 para Nodemailer)
GMAIL_USER=suporte.violib@gmail.com
GMAIL_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=seu_client_secret
GMAIL_REFRESH_TOKEN=seu_refresh_token_gerado_no_oauth playground

# Configurações do Cloudinary (Armazenamento de Imagens)
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# URL Base
FRONTEND_URL=http://localhost:5173

```

Inicie o servidor de desenvolvimento:

```
npm run dev
```

### 3. Configurar e Iniciar o Frontend

Abra um novo terminal na pasta raiz e navegue para o frontend:

```
cd frontend
npm install
```

Crie um arquivo .env na pasta frontend/:

```
VITE_GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
VITE_API_URL=http://localhost:3000/api
```

Inicie o servidor Vite:

```
npm run dev
```

## 📄 Licença

Distribuído sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE.md) para mais informações.

Desenvolvido por [Anderson Vioto](mailto:anderson.vioto@gmail.com).

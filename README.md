# 🎮 EloDex - Pokémon Game

Um aplicativo mobile completo de jogo Pokémon desenvolvido em React Native, inspirado no visual clássico da Pokédex dos primeiros episódios.

## 🎯 **Sobre o Projeto**

O EloDex é um jogo Pokémon completo que permite aos jogadores:
- Criar personagens únicos com diferentes classes e origens
- Capturar Pokémon selvagens
- Batalhar contra outros jogadores em tempo real
- Treinar e evoluir seus Pokémon
- Interagir socialmente com outros treinadores

## 🎨 **Design e Visual**

### **Paleta de Cores Oficial:**
- 🔴 **Vermelho**: `#DC3545` (Primário)
- 🟡 **Amarelo**: `#FFC107` (Secundário)
- 🔵 **Azul**: `#007BFF` (Accent)
- ⚫ **Preto**: `#000000` (Texto)
- ⚪ **Branco**: `#FFFFFF` (Background)
- 🔘 **Cinza**: `#6C757D` (Neutro)

### **Inspiração Visual:**
- Design retrô inspirado na Pokédex clássica
- Interface nostálgica dos primeiros episódios de Pokémon
- Elementos visuais autênticos (Pokéballs, luzes, sombras)

## 🚀 **Funcionalidades Implementadas**

### **✅ Sistema de Autenticação:**
- Login com email/senha
- Registro de novos usuários
- Recuperação de senha por código
- Login social (Google, Facebook) - *Em desenvolvimento*
- Validações robustas e feedback visual

### **✅ Gerenciamento de Personagens:**
- Criação de personagens com diferentes classes
- Sistema VIP (múltiplos personagens)
- Armazenamento local seguro
- Lista visual de personagens

### **✅ Navegação Fluida:**
- Transições suaves entre telas
- Navegação baseada em estado de autenticação
- Feedback visual em todas as operações

## 🛠️ **Tecnologias Utilizadas**

### **Frontend:**
- **React Native** 0.72.6
- **TypeScript** para tipagem
- **React Navigation** para navegação
- **AsyncStorage** para persistência local

### **Bibliotecas Principais:**
- `@react-navigation/native` - Navegação
- `@react-navigation/stack` - Stack Navigator
- `react-native-safe-area-context` - Área segura
- `react-native-gesture-handler` - Gestos
- `react-native-screens` - Performance de telas

### **Futuras Integrações:**
- **Firebase** - Backend e autenticação
- **PokeAPI** - Dados oficiais de Pokémon
- **React Native Firebase** - Serviços em nuvem

## 📱 **Compatibilidade**

- ✅ **Android** 5.0+ (API 21+)
- ✅ **iOS** 11.0+
- ✅ **Responsivo** para diferentes tamanhos de tela
- ✅ **Acessibilidade** básica implementada

## 🏗️ **Estrutura do Projeto**

```
EloDex-Complete/
├── 📱 android/                    # Configurações Android
│   ├── app/
│   │   ├── build.gradle          # Build do app
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── java/com/elodex/
│   │           ├── MainActivity.java
│   │           └── MainApplication.java
│   ├── build.gradle              # Build raiz
│   ├── settings.gradle           # Configurações
│   └── gradle.properties         # Propriedades
├── 📂 src/                       # Código fonte
│   ├── 🖥️ screens/               # Telas do app
│   │   ├── LoginScreen.tsx       # Login retrô
│   │   ├── RegisterScreen.tsx    # Registro
│   │   ├── ForgotPasswordScreen.tsx # Recuperação
│   │   └── HomeScreen.tsx        # Lista personagens
│   ├── 🧭 navigation/            # Navegação
│   │   ├── AuthNavigator.tsx     # Fluxo autenticação
│   │   ├── MainNavigator.tsx     # App principal
│   │   └── RootNavigator.tsx     # Navegador raiz
│   ├── 🔧 context/               # Contextos React
│   │   └── AuthContext.tsx       # Autenticação
│   ├── 🛠️ services/              # Serviços
│   │   └── CharacterService.ts   # Gerenciamento personagens
│   └── 🎨 utils/                 # Utilitários
│       └── Colors.ts             # Paleta de cores
├── 📄 App.tsx                    # Componente principal
├── 📄 index.js                   # Ponto de entrada
├── ⚙️ package.json               # Dependências
├── ⚙️ metro.config.js            # Configuração Metro
├── ⚙️ babel.config.js            # Configuração Babel
├── ⚙️ app.json                   # Configurações app
└── 📖 README.md                  # Esta documentação
```

## 🚀 **Como Executar**

### **Pré-requisitos:**
- Node.js 16+
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS - apenas macOS)

### **Instalação:**

1. **Clone/Extraia o projeto:**
   ```bash
   cd EloDex-Complete
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Para Android:**
   ```bash
   npx react-native run-android
   ```

4. **Para iOS:**
   ```bash
   npx react-native run-ios
   ```

### **Comandos Úteis:**

```bash
# Limpar cache
npx react-native start --reset-cache

# Build para produção (Android)
cd android && ./gradlew assembleRelease

# Verificar dependências
npx react-native doctor
```

## 🎮 **Fluxo do Usuário**

### **1. Primeiro Acesso:**
1. **Registro** → Criar conta
2. **Login** → Entrar no app
3. **Criação de Personagem** → Escolher classe/origem
4. **Jogo Principal** → Começar aventura

### **2. Usuário Existente:**
1. **Login** → Entrar no app
2. **Lista de Personagens** → Escolher personagem
3. **Jogo Principal** → Continuar aventura

### **3. Sistema VIP:**
- **Gratuito**: 1 personagem
- **VIP**: Múltiplos personagens + benefícios

## 🔮 **Próximas Funcionalidades**

### **🎯 Em Desenvolvimento:**
- [ ] Tela de criação de personagem
- [ ] Integração com PokeAPI
- [ ] Sistema de captura de Pokémon
- [ ] Batalhas PvP em tempo real
- [ ] Sistema de amizades e chat
- [ ] PokéMart com itens
- [ ] Centro Pokémon
- [ ] Sistema de ranking

### **🚀 Futuras Expansões:**
- [ ] Modo offline
- [ ] Notificações push
- [ ] Sistema de conquistas
- [ ] Eventos especiais
- [ ] Trading de Pokémon
- [ ] Ginásios e Liga Pokémon

## 🐛 **Problemas Conhecidos**

- Login social ainda não implementado (simulado)
- Algumas validações podem ser aprimoradas
- Testes unitários pendentes

## 🤝 **Contribuição**

Este é um projeto em desenvolvimento ativo. Funcionalidades são adicionadas progressivamente seguindo a documentação oficial do projeto.

## 📄 **Licença**

Projeto desenvolvido para fins educacionais e de demonstração.

---

**🎮 Desenvolvido com ❤️ para a comunidade Pokémon!**


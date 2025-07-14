// color-palette.js
// Paleta de cores oficial do app Pokémon

export const COLORS = {
  // Cores principais
  PRIMARY: {
    RED: '#DC143C',           // Vermelho vibrante (Pokéball)
    YELLOW: '#FFD700',        // Amarelo dourado (Pikachu)
    BLUE: '#1E90FF',          // Azul royal (Água)
    BLACK: '#2C2C2C',         // Preto suave
    WHITE: '#FFFFFF',         // Branco puro
    GRAY: '#808080'           // Cinza médio
  },
  
  // Variações para diferentes contextos
  VARIANTS: {
    RED: {
      LIGHT: '#FF6B6B',       // Vermelho claro
      DARK: '#B22222',        // Vermelho escuro
      TRANSPARENT: 'rgba(220, 20, 60, 0.1)'
    },
    YELLOW: {
      LIGHT: '#FFEB3B',       // Amarelo claro
      DARK: '#FFA000',        // Amarelo escuro
      TRANSPARENT: 'rgba(255, 215, 0, 0.1)'
    },
    BLUE: {
      LIGHT: '#87CEEB',       // Azul claro
      DARK: '#191970',        // Azul escuro
      TRANSPARENT: 'rgba(30, 144, 255, 0.1)'
    },
    GRAY: {
      LIGHT: '#D3D3D3',       // Cinza claro
      DARK: '#696969',        // Cinza escuro
      TRANSPARENT: 'rgba(128, 128, 128, 0.1)'
    }
  },
  
  // Cores específicas para tipos de Pokémon
  POKEMON_TYPES: {
    NORMAL: '#A8A878',
    FIRE: '#F08030',
    WATER: '#6890F0',
    ELECTRIC: '#F8D030',
    GRASS: '#78C850',
    ICE: '#98D8D8',
    FIGHTING: '#C03028',
    POISON: '#A040A0',
    GROUND: '#E0C068',
    FLYING: '#A890F0',
    PSYCHIC: '#F85888',
    BUG: '#A8B820',
    ROCK: '#B8A038',
    GHOST: '#705898',
    DRAGON: '#7038F8',
    DARK: '#705848',
    STEEL: '#B8B8D0',
    FAIRY: '#EE99AC'
  },
  
  // Cores para status e feedback
  STATUS: {
    SUCCESS: '#4CAF50',      // Verde para sucesso
    ERROR: '#F44336',        // Vermelho para erro
    WARNING: '#FF9800',      // Laranja para aviso
    INFO: '#2196F3',         // Azul para informação
    DISABLED: '#BDBDBD'      // Cinza para desabilitado
  },
  
  // Cores para raridade
  RARITY: {
    COMMON: '#808080',       // Cinza
    UNCOMMON: '#00FF00',     // Verde
    RARE: '#0080FF',         // Azul
    EPIC: '#8000FF',         // Roxo
    LEGENDARY: '#FFD700',    // Dourado
    MYTHICAL: '#FF1493',     // Rosa
    SHINY: '#FFD700'         // Dourado brilhante
  },
  
  // Cores para UI específica
  UI: {
    BACKGROUND: '#F5F5F5',   // Fundo principal
    CARD: '#FFFFFF',         // Fundo de cards
    BORDER: '#E0E0E0',       // Bordas
    SHADOW: 'rgba(0, 0, 0, 0.1)', // Sombras
    OVERLAY: 'rgba(0, 0, 0, 0.5)', // Overlay
    POKEBALL: '#DC143C',     // Cor da Pokéball
    GREATBALL: '#4169E1',    // Cor da Great Ball
    ULTRABALL: '#FFD700',    // Cor da Ultra Ball
    MASTERBALL: '#8A2BE2'    // Cor da Master Ball
  },
  
  // Gradientes
  GRADIENTS: {
    PRIMARY: ['#DC143C', '#FFD700'], // Vermelho para amarelo
    SECONDARY: ['#1E90FF', '#87CEEB'], // Azul escuro para claro
    BACKGROUND: ['#F5F5F5', '#FFFFFF'], // Cinza claro para branco
    POKEBALL: ['#DC143C', '#FFFFFF', '#2C2C2C'], // Cores da Pokéball
    SHINY: ['#FFD700', '#FFA500', '#FFD700'], // Efeito dourado
    LEGENDARY: ['#FFD700', '#FF6347', '#FFD700'] // Efeito lendário
  }
};

// Função para obter cor por tipo de Pokémon
export const getPokemonTypeColor = (type) => {
  return COLORS.POKEMON_TYPES[type.toUpperCase()] || COLORS.VARIANTS.GRAY.LIGHT;
};

// Função para obter cor por raridade
export const getRarityColor = (rarity) => {
  return COLORS.RARITY[rarity.toUpperCase()] || COLORS.RARITY.COMMON;
};

// Função para criar gradiente
export const createGradient = (colors, direction = 'vertical') => {
  return {
    colors,
    start: direction === 'vertical' ? { x: 0, y: 0 } : { x: 0, y: 0 },
    end: direction === 'vertical' ? { x: 0, y: 1 } : { x: 1, y: 0 }
  };
};

// Temas para diferentes modos
export const THEMES = {
  LIGHT: {
    background: COLORS.PRIMARY.WHITE,
    surface: COLORS.UI.CARD,
    text: COLORS.PRIMARY.BLACK,
    textSecondary: COLORS.VARIANTS.GRAY.DARK,
    border: COLORS.UI.BORDER,
    primary: COLORS.PRIMARY.RED,
    secondary: COLORS.PRIMARY.BLUE,
    accent: COLORS.PRIMARY.YELLOW
  },
  
  DARK: {
    background: COLORS.PRIMARY.BLACK,
    surface: COLORS.VARIANTS.GRAY.DARK,
    text: COLORS.PRIMARY.WHITE,
    textSecondary: COLORS.VARIANTS.GRAY.LIGHT,
    border: COLORS.VARIANTS.GRAY.DARK,
    primary: COLORS.VARIANTS.RED.LIGHT,
    secondary: COLORS.VARIANTS.BLUE.LIGHT,
    accent: COLORS.PRIMARY.YELLOW
  }
};

export default COLORS;


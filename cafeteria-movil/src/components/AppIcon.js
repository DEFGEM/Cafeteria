import Ionicons from '@expo/vector-icons/Ionicons';

const ICON_MAP = {
  '☕': 'cafe', '🥐': 'fast-food', '🥤': 'water', '🥛': 'water', '🍳': 'restaurant',
  '🍫': 'nutrition', '🥪': 'fast-food', '🍪': 'ellipse', '🧊': 'snow', '🧻': 'layers',
  '🍽️': 'restaurant', '⭐': 'star', '🎁': 'gift', '🧍': 'person', '👨‍🍳': 'restaurant',
  '👤': 'person', '🏠': 'home', '🔔': 'notifications', '💵': 'cash', '💰': 'wallet',
  '💳': 'card', '🧾': 'receipt', '📄': 'document-text', '📋': 'clipboard', '📝': 'create',
  '📦': 'cube', '🛒': 'cart', '📢': 'megaphone', '📊': 'bar-chart', '📈': 'trending-up',
  '📉': 'trending-down', '✅': 'checkmark-circle', '❌': 'close-circle', '⚠️': 'warning',
  '⏳': 'time', '🔥': 'flame', '🔍': 'search', '🔎': 'search', '💬': 'chatbubble',
  '🛡️': 'shield-checkmark', '⚙️': 'settings', '❓': 'help-circle', '🌙': 'moon',
  '☀️': 'sunny', '📐': 'resize', '🔄': 'sync', '💾': 'save', '➕': 'add-circle',
  '✏️': 'create', '🗑️': 'trash', '⏸️': 'pause-circle', '✉': 'mail', '🔒': 'lock-closed',
  '🔢': 'calculator', '⚖️': 'scale',
  'ðŸ¥›': 'water', 'ðŸ¥¤': 'water', 'ðŸ‘¤': 'person', 'âš™ï¸': 'settings', 'â“': 'help-circle',
};

export function resolveIconName(value) {
  if (!value) return 'ellipse-outline';
  if (ICON_MAP[value]) return ICON_MAP[value];
  if (/^[a-z0-9-]+$/.test(value)) return value;
  return 'ellipse-outline';
}

export default function AppIcon({ color, name, size = 20, style }) {
  return <Ionicons color={color} name={resolveIconName(name)} size={size} style={style} />;
}

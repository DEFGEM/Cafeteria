import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import EmptyState from '../components/EmptyState';
import AppIcon from '../components/AppIcon';
import MockStatusBar from '../components/MockStatusBar';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';
import SummaryCard from '../components/SummaryCard';

const filters = ['Todo', 'Cliente / Mesero', 'Caja', 'Cocina', 'Inventario'];

export default function ActivityScreen({
  goBack,
  isDarkMode,
  navigate,
  setIsDarkMode,
  systemEvents = [],
  theme,
}) {
  const [activeFilter, setActiveFilter] = useState('Todo');
  const [query, setQuery] = useState('');
  const filteredEvents = systemEvents.filter((event) => {
    const matchesFilter = activeFilter === 'Todo' || event.module === activeFilter;
    const searchText = `${event.title} ${event.detail} ${event.module}`.toLowerCase();

    return matchesFilter && searchText.includes(query.trim().toLowerCase());
  });

  return (
    <ScreenBackground isDarkMode={isDarkMode} theme={theme} contentStyle={styles.screen}>
      <View style={styles.content}>
        <MockStatusBar isDarkMode={isDarkMode} navigate={navigate} onBack={goBack} setIsDarkMode={setIsDarkMode} showBack theme={theme} />

        <View style={styles.header}>
          <View>
            <Text selectable style={[styles.eyebrow, { color: theme.amber }]}>
              Auditoria
            </Text>
            <Text selectable style={[styles.title, { color: theme.title }]}>
              Actividad
            </Text>
            <Text selectable style={[styles.subtitle, { color: theme.muted }]}>
              Historial de cambios del sistema
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: isDarkMode ? theme.accent : theme.accentAlt, boxShadow: theme.logoShadow }]}>
            <AppIcon color={theme.amber} name="receipt" size={24} />
          </View>
        </View>

        <SummaryCard
          title="Eventos registrados"
          amount={`${systemEvents.length} acciones`}
          subtitle="Pagos, cancelaciones, stock, menu y pedidos"
          icon="📋"
          isDarkMode={isDarkMode}
          theme={theme}
        />

        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, boxShadow: theme.cardShadow }]}>
          <AppIcon color={theme.muted} name="search" size={18} />
          <TextInput
            onChangeText={setQuery}
            placeholder="Buscar en actividad..."
            placeholderTextColor={theme.muted}
            style={[styles.searchInput, { color: theme.title }]}
            value={query}
          />
        </View>

        <View style={styles.filterRow}>
          {filters.map((filter) => {
            const active = filter === activeFilter;

            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterChip, { backgroundColor: active ? theme.accent : theme.actionSoft }]}
              >
                <Text selectable style={[styles.filterText, { color: active ? '#ffffff' : theme.amber }]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle title="Linea de tiempo" subtitle="Cambios importantes ordenados del mas reciente al mas antiguo" compact theme={theme} />

        {filteredEvents.length ? (
          <View style={styles.timeline}>
            {filteredEvents.map((event, index) => (
              <ActivityRow key={event.id} event={event} index={index} isDarkMode={isDarkMode} theme={theme} />
            ))}
          </View>
        ) : (
          <EmptyState
            actionLabel="Ver notificaciones"
            icon="📋"
            onAction={() => navigate('notifications')}
            subtitle="No hay eventos que coincidan con tu busqueda o filtro."
            theme={theme}
            title="Sin actividad"
          />
        )}
      </View>

    </ScreenBackground>
  );
}

function ActivityRow({ event, index, isDarkMode, theme }) {
  const colors = getSeverityColors(event.severity, isDarkMode, theme);

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: colors.dot }]} />
        {index < 999 ? <View style={[styles.timelineLine, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(120,53,15,0.12)' }]} /> : null}
      </View>
      <View
        style={[
          styles.eventCard,
          {
            backgroundColor: theme.surface,
            borderColor: colors.border,
            boxShadow: theme.cardShadow,
          },
        ]}
      >
        <View style={styles.eventHeader}>
          <View style={[styles.eventIcon, { backgroundColor: colors.bg }]}>
            <AppIcon color={theme.amber} name={event.icon} size={19} />
          </View>
          <View style={styles.eventCopy}>
            <Text selectable style={[styles.eventTitle, { color: theme.title }]}>
              {event.title}
            </Text>
            <Text selectable style={[styles.eventMeta, { color: theme.muted }]}>
              {event.module} · {event.createdAt}
            </Text>
          </View>
        </View>
        <Text selectable style={[styles.eventDetail, { color: theme.muted }]}>
          {event.detail}
        </Text>
      </View>
    </View>
  );
}

function getSeverityColors(severity, isDarkMode, theme) {
  if (severity === 'warning') {
    return { bg: theme.warningBg, border: isDarkMode ? theme.warningText : 'rgba(245, 158, 11, 0.30)', dot: theme.warningText };
  }

  if (severity === 'success') {
    return {
      bg: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7',
      border: isDarkMode ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.20)',
      dot: '#16a34a',
    };
  }

  return { bg: theme.actionSoft, border: theme.surfaceBorder, dot: theme.amber };
}

const styles = StyleSheet.create({
  screen: {
    minHeight: 980,
    paddingBottom: 104,
  },
  content: {
    flex: 1,
    paddingBottom: 22,
    paddingHorizontal: 31,
    paddingTop: 31,
    position: 'relative',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 28,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 35,
    paddingTop: 4,
  },
  subtitle: {
    fontSize: 13,
    paddingTop: 4,
  },
  headerIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 29,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  headerIconText: {
    fontSize: 27,
  },
  searchBox: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    height: 46,
    marginTop: 14,
    paddingHorizontal: 15,
  },
  searchIcon: {
    fontSize: 13,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    outlineStyle: 'none',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    borderCurve: 'continuous',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  filterText: {
    fontSize: 10,
    fontWeight: '900',
  },
  timeline: {
    gap: 0,
    paddingTop: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timelineRail: {
    alignItems: 'center',
    width: 18,
  },
  timelineDot: {
    borderRadius: 999,
    height: 12,
    marginTop: 17,
    width: 12,
  },
  timelineLine: {
    flex: 1,
    minHeight: 74,
    width: 2,
  },
  eventCard: {
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    marginBottom: 10,
    padding: 13,
  },
  eventHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  eventIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  eventIconText: {
    fontSize: 18,
  },
  eventCopy: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  eventMeta: {
    fontSize: 10,
    paddingTop: 3,
  },
  eventDetail: {
    fontSize: 11,
    lineHeight: 15,
    paddingTop: 8,
  },
});

import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Modal from '../components/AdaptiveModal';
import { useState } from 'react';

import MockStatusBar from '../components/MockStatusBar';
import AppIcon from '../components/AppIcon';
import ScreenBackground from '../components/ScreenBackground';
import SectionTitle from '../components/SectionTitle';

const faqItems = [
  {
    answer: 'Desde Cliente / Mesero crea el pedido, Caja lo confirma y Cocina actualiza preparacion/listo. Los estados se reflejan en Mis pedidos.',
    question: 'Como fluye un pedido?',
  },
  {
    answer: 'En Caja > Pedidos puedes editar el metodo de pago de pedidos confirmados o cancelar si el cliente se arrepiente.',
    question: 'Como cambio el metodo de pago?',
  },
  {
    answer: 'En Cocina > Inventario toca un insumo, abre Ajustar stock y registra entrada o salida con cantidad y motivo.',
    question: 'Como ajusto existencias?',
  },
  {
    answer: 'En Cocina > Menu puedes pausar productos, editarlos, duplicarlos o eliminarlos. El pedido de mesero solo muestra productos activos.',
    question: 'Como controlo el menu disponible?',
  },
];

const quickGuides = [
  { icon: '🧍', title: 'Mesero', text: 'Levanta pedidos, sugiere promociones y revisa demoras de cocina.' },
  { icon: '💵', title: 'Caja', text: 'Confirma pagos, edita metodos, registra gastos y cierra corte.' },
  { icon: '👨‍🍳', title: 'Cocina', text: 'Prepara pedidos, reporta demoras y descuenta inventario.' },
  { icon: '📦', title: 'Inventario', text: 'Consulta stock bajo, compras pendientes y movimientos recientes.' },
];

export default function HelpScreen({ goBack, isDarkMode, navigate, setIsDarkMode, theme, userProfile }) {
  const [openFaq, setOpenFaq] = useState(faqItems[0].question);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [ticketSent, setTicketSent] = useState(null);
  const [ticket, setTicket] = useState({
    area: 'Operacion',
    detail: '',
    subject: '',
  });

  const submitTicket = () => {
    const cleanSubject = ticket.subject.trim() || 'Solicitud general';

    setTicketSent({
      id: `AY-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: cleanSubject,
    });
    setTicket({ area: 'Operacion', detail: '', subject: '' });
    setIsTicketOpen(false);
  };

  return (
    <ScreenBackground isDarkMode={isDarkMode} theme={theme} contentStyle={styles.screen}>
      <View style={styles.content}>
        <MockStatusBar isDarkMode={isDarkMode} navigate={navigate} onBack={goBack} setIsDarkMode={setIsDarkMode} showBack theme={theme} />

        <View style={styles.header}>
          <View>
            <Text selectable style={[styles.eyebrow, { color: theme.amber }]}>
              Soporte
            </Text>
            <Text selectable style={[styles.title, { color: theme.title }]}>
              Ayuda
            </Text>
            <Text selectable style={[styles.subtitle, { color: theme.muted }]}>
              Guias rapidas y contacto interno
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: isDarkMode ? theme.accent : theme.accentAlt, boxShadow: theme.logoShadow }]}>
            <AppIcon color={theme.amber} name="help-circle" size={24} />
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? theme.accent : theme.accentAlt, boxShadow: theme.strongShadow }]}>
          <View>
            <Text selectable style={styles.summaryLabel}>
              Centro de ayuda
            </Text>
            <Text selectable style={styles.summaryValue}>
              4 guias
            </Text>
            <Text selectable style={styles.summaryHint}>
              Respuestas para operar sin detenerte
            </Text>
          </View>
          <View style={styles.summaryIcon}>
            <AppIcon color={theme.amber} name="chatbubble" size={21} />
          </View>
        </View>

        <SectionTitle title="Necesitas algo rapido?" subtitle="Acciones directas para resolver bloqueos" compact theme={theme} />

        <View style={styles.quickActions}>
          <Pressable onPress={() => setIsTicketOpen(true)} style={[styles.primaryAction, { backgroundColor: theme.accent }]}>
            <Text selectable style={styles.primaryActionText}>
              Crear ticket de soporte
            </Text>
          </Pressable>
          <Pressable onPress={() => navigate('settings')} style={[styles.secondaryAction, { backgroundColor: theme.actionSoft }]}>
            <Text selectable style={[styles.secondaryActionText, { color: theme.title }]}>
              Revisar ajustes
            </Text>
          </Pressable>
        </View>

        <View style={[styles.contactCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, boxShadow: theme.cardShadow }]}>
          <View style={[styles.contactIcon, { backgroundColor: theme.softIcon }]}>
            <AppIcon color={theme.amber} name="cafe" size={21} />
          </View>
          <View style={styles.contactCopy}>
            <Text selectable style={[styles.contactTitle, { color: theme.title }]}>
              Soporte interno
            </Text>
            <Text selectable style={[styles.contactDetail, { color: theme.muted }]}>
              {userProfile?.name || 'Usuario'} · Admin · respuesta estimada 10 min
            </Text>
          </View>
        </View>

        <SectionTitle title="Guias por modulo" subtitle="Flujos principales del sistema" compact theme={theme} />

        <View style={styles.guideGrid}>
          {quickGuides.map((guide) => (
            <View
              key={guide.title}
              style={[
                styles.guideCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.surfaceBorder,
                  boxShadow: theme.cardShadow,
                },
              ]}
            >
              <View style={[styles.guideIcon, { backgroundColor: theme.softIcon }]}>
                <AppIcon color={theme.amber} name={guide.icon} size={21} />
              </View>
              <Text selectable style={[styles.guideTitle, { color: theme.title }]}>
                {guide.title}
              </Text>
              <Text selectable style={[styles.guideText, { color: theme.muted }]}>
                {guide.text}
              </Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Preguntas frecuentes" subtitle="Toca una pregunta para ver la respuesta" compact theme={theme} />

        <View style={styles.faqList}>
          {faqItems.map((item) => {
            const isOpen = openFaq === item.question;

            return (
              <Pressable
                key={item.question}
                onPress={() => setOpenFaq(isOpen ? null : item.question)}
                style={[
                  styles.faqCard,
                  {
                    backgroundColor: isOpen ? theme.surfaceAlt : theme.surface,
                    borderColor: isOpen ? theme.amber : theme.surfaceBorder,
                    boxShadow: theme.cardShadow,
                  },
                ]}
              >
                <View style={styles.faqHeader}>
                  <Text selectable style={[styles.faqQuestion, { color: theme.title }]}>
                    {item.question}
                  </Text>
                  <Text style={[styles.faqIcon, { color: theme.amber }]}>{isOpen ? '-' : '+'}</Text>
                </View>
                {isOpen && (
                  <Text selectable style={[styles.faqAnswer, { color: theme.muted }]}>
                    {item.answer}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.statusCard, { backgroundColor: theme.surfaceAlt, borderColor: isDarkMode ? theme.surfaceBorder : 'transparent' }]}>
          <Text selectable style={[styles.statusTitle, { color: theme.title }]}>
            Estado del soporte
          </Text>
          <Text selectable style={[styles.statusText, { color: theme.muted }]}>
            Sin incidentes criticos. Pedidos, caja, cocina e inventario se encuentran disponibles.
          </Text>
          <View style={styles.statusPills}>
            {['Pedidos', 'Caja', 'Cocina'].map((label) => (
              <View key={label} style={[styles.statusPill, { backgroundColor: isDarkMode ? 'rgba(34,197,94,0.14)' : '#dcfce7' }]}>
                <Text selectable style={styles.statusPillText}>
                  {label} OK
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>


      <TicketModal
        isDarkMode={isDarkMode}
        onChange={setTicket}
        onClose={() => setIsTicketOpen(false)}
        onSubmit={submitTicket}
        theme={theme}
        ticket={ticket}
        visible={isTicketOpen}
      />
      <TicketSentModal isDarkMode={isDarkMode} onClose={() => setTicketSent(null)} theme={theme} ticket={ticketSent} />
    </ScreenBackground>
  );
}

function TicketModal({ isDarkMode, onChange, onClose, onSubmit, theme, ticket, visible }) {
  const canSubmit = ticket.subject.trim().length > 0 || ticket.detail.trim().length > 0;

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalLayer}>
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: isDarkMode ? '#231811' : '#ffffff', borderColor: theme.surfaceBorder }]}>
          <View style={styles.grabber} />
          <Text selectable style={[styles.sheetTitle, { color: theme.title }]}>
            Nuevo ticket
          </Text>
          <View style={[styles.inputBox, { backgroundColor: theme.actionSoft, borderColor: theme.surfaceBorder }]}>
            <Text selectable style={[styles.inputLabel, { color: theme.muted }]}>
              Asunto
            </Text>
            <TextInput
              onChangeText={(value) => onChange({ ...ticket, subject: value })}
              placeholder="Ej. No aparece un pedido"
              placeholderTextColor={theme.muted}
              style={[styles.input, { color: theme.title }]}
              value={ticket.subject}
            />
          </View>
          <View style={styles.areaRow}>
            {['Operacion', 'Caja', 'Cocina'].map((area) => {
              const isActive = ticket.area === area;

              return (
                <Pressable
                  key={area}
                  onPress={() => onChange({ ...ticket, area })}
                  style={[styles.areaButton, { backgroundColor: isActive ? theme.accent : theme.actionSoft }]}
                >
                  <Text selectable style={[styles.areaButtonText, { color: isActive ? '#ffffff' : theme.title }]}>
                    {area}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={[styles.textAreaBox, { backgroundColor: theme.actionSoft, borderColor: theme.surfaceBorder }]}>
            <Text selectable style={[styles.inputLabel, { color: theme.muted }]}>
              Detalle
            </Text>
            <TextInput
              multiline
              onChangeText={(value) => onChange({ ...ticket, detail: value })}
              placeholder="Describe que paso y en que vista estabas."
              placeholderTextColor={theme.muted}
              style={[styles.textArea, { color: theme.title }]}
              value={ticket.detail}
            />
          </View>
          <View style={styles.sheetActions}>
            <SheetButton label="Cancelar" onPress={onClose} secondary theme={theme} />
            <SheetButton disabled={!canSubmit} label="Enviar" onPress={onSubmit} theme={theme} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TicketSentModal({ isDarkMode, onClose, theme, ticket }) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={Boolean(ticket)}>
      <View style={styles.centerLayer}>
        <View style={[styles.sentBox, { backgroundColor: isDarkMode ? '#231811' : '#ffffff', borderColor: theme.surfaceBorder }]}>
          <Text selectable style={[styles.sheetTitle, { color: theme.title }]}>
            Ticket enviado
          </Text>
          <Text selectable style={[styles.sentText, { color: theme.muted }]}>
            {ticket ? `${ticket.id} · ${ticket.subject}` : ''}
          </Text>
          <Pressable onPress={onClose} style={[styles.sentButton, { backgroundColor: theme.accent }]}>
            <Text selectable style={styles.sentButtonText}>
              Entendido
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function SheetButton({ disabled = false, label, onPress, secondary = false, theme }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.sheetButton,
        {
          backgroundColor: disabled ? 'rgba(120, 113, 108, 0.35)' : secondary ? theme.actionSoft : theme.accent,
        },
      ]}
    >
      <Text selectable style={[styles.sheetButtonText, { color: secondary ? theme.title : '#ffffff' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    minHeight: 1280,
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
    fontSize: 28,
  },
  summaryCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    padding: 19,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    paddingTop: 6,
  },
  summaryHint: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    paddingTop: 5,
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderCurve: 'continuous',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  summaryIconText: {
    fontSize: 26,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
  },
  primaryAction: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 17,
    flex: 1.4,
    minHeight: 50,
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  secondaryAction: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 17,
    flex: 1,
    minHeight: 50,
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '900',
  },
  contactCard: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    padding: 14,
  },
  contactIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  contactIconText: {
    fontSize: 21,
  },
  contactCopy: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  contactDetail: {
    fontSize: 11,
    lineHeight: 15,
    paddingTop: 3,
  },
  guideGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
  },
  guideCard: {
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 132,
    padding: 13,
    width: '48%',
  },
  guideIcon: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  guideIconText: {
    fontSize: 18,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '900',
    paddingTop: 10,
  },
  guideText: {
    fontSize: 10,
    lineHeight: 14,
    paddingTop: 4,
  },
  faqList: {
    gap: 10,
    paddingTop: 12,
  },
  faqCard: {
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  faqHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
  },
  faqIcon: {
    fontSize: 22,
    fontWeight: '900',
  },
  faqAnswer: {
    fontSize: 11,
    lineHeight: 16,
    paddingTop: 8,
  },
  statusCard: {
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  statusText: {
    fontSize: 12,
    lineHeight: 17,
    paddingTop: 6,
  },
  statusPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
  },
  statusPill: {
    borderCurve: 'continuous',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '900',
  },
  modalLayer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 24,
  },
  grabber: {
    alignSelf: 'center',
    backgroundColor: 'rgba(120, 113, 108, 0.45)',
    borderRadius: 999,
    height: 5,
    marginBottom: 8,
    width: 70,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  inputBox: {
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  input: {
    fontSize: 15,
    fontWeight: '800',
    minHeight: 32,
    padding: 0,
    paddingTop: 4,
  },
  areaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  areaButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
  },
  areaButtonText: {
    fontSize: 11,
    fontWeight: '900',
  },
  textAreaBox: {
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textArea: {
    fontSize: 14,
    fontWeight: '800',
    minHeight: 94,
    padding: 0,
    paddingTop: 6,
    textAlignVertical: 'top',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  sheetButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    flex: 1,
    minHeight: 50,
    justifyContent: 'center',
  },
  sheetButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  centerLayer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  sentBox: {
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 20,
    width: '100%',
  },
  sentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sentButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  sentButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
});

import { useState, useEffect, useRef } from 'react';
import {
  Card, Text, Stack, Group, Badge, Button, Textarea,
  Loader, Center, Paper, Title, ActionIcon, ScrollArea,
  Modal, TextInput, Select, Box, Indicator, FileButton, Image,
  CloseButton, Tooltip, Collapse, UnstyledButton
} from '@mantine/core';
import {
  IconSend, IconPlus, IconArrowLeft, IconCheck,
  IconClock, IconAlertCircle, IconArchive, IconX,
  IconPaperclip, IconFile, IconChevronDown, IconChevronRight
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { ticketApi, userApi } from '../api/client';
import { notifications } from '@mantine/notifications';
import { useStore } from '../store/useStore';

interface MediaFile {
  name: string;
  type: string;
  size: number;
  data: string;
  url?: string;
}

interface TicketMessage {
  message_id: number;
  ticket_id: number;
  user_id: number | null;
  admin_id: number | null;
  is_admin: number;
  message: string;
  media?: MediaFile[];
  created: string;
}

interface ServiceInfo {
  category: string;
  cost: number;
  name: string;
}

interface UserService {
  user_service_id: number;
  service_id: number;
  name?: string;
  service: ServiceInfo;
  status: string;
  expire: string | null;
  created: string;
  parent: number | null;
  settings?: Record<string, unknown>;
  children?: UserService[];
}

interface Ticket {
  ticket_id: number;
  user_id: number;
  category_id: number | null;
  subject: string;
  status: 'open' | 'in_progress' | 'waiting' | 'closed' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  ticket_type: 'service' | 'payment' | 'other';
  user_service_id: number | null;
  created: string;
  updated: string;
  closed_at: string | null;
  messages?: TicketMessage[];
}

const statusColors: Record<string, string> = {
  'open': 'blue',
  'in_progress': 'cyan',
  'waiting': 'yellow',
  'closed': 'gray',
  'archived': 'dark',
};

const statusIcons: Record<string, React.ReactNode> = {
  'open': <IconAlertCircle size={14} />,
  'in_progress': <IconClock size={14} />,
  'waiting': <IconClock size={14} />,
  'closed': <IconCheck size={14} />,
  'archived': <IconArchive size={14} />,
};

const priorityColors: Record<string, string> = {
  'low': 'gray',
  'normal': 'blue',
  'high': 'orange',
  'urgent': 'red',
};

function TicketList({
  tickets,
  onSelect,
  loading,
  lastTicketCheck
}: {
  tickets: Ticket[];
  onSelect: (ticket: Ticket) => void;
  loading: boolean;
  lastTicketCheck: number;
}) {
  const { t } = useTranslation();
  const [showClosed, setShowClosed] = useState(false);
  const activeTickets = tickets.filter(t => t.status !== 'closed' && t.status !== 'archived');
  const closedTickets = tickets.filter(t => t.status === 'closed' || t.status === 'archived');
  const hasNewMessages = (ticket: Ticket): boolean => {
    if (!ticket.messages || ticket.messages.length === 0) return false;
    const hasNew = ticket.messages.some(msg => {
      if (msg.is_admin !== 1) return false;
      const msgTime = new Date(msg.created).getTime();
      return msgTime > lastTicketCheck;
    });
    return hasNew;
  };

  const renderTicket = (ticket: Ticket) => {
    const isNew = hasNewMessages(ticket);
    return (
      <Indicator
        key={ticket.ticket_id}
        color="red"
        size={12}
        offset={8}
        position="top-start"
        disabled={!isNew}
        withBorder
        processing={isNew}
      >
        <Card
          shadow="sm"
          padding="md"
          radius="md"
          withBorder
          style={{
            cursor: 'pointer',
            borderColor: isNew ? 'var(--mantine-color-red-5)' : undefined,
            borderWidth: isNew ? 2 : undefined,
          }}
          onClick={() => onSelect(ticket)}
        >
          <Group justify="space-between" mb="xs">
            <Group gap="xs" style={{ flex: 1 }}>
              {isNew && (
                <Badge color="red" size="xs" variant="filled">
                  {t('tickets.newMessage')}
                </Badge>
              )}
              <Text fw={isNew ? 700 : 500} lineClamp={1} style={{ flex: 1 }}>
                {ticket.subject}
              </Text>
            </Group>
            <Badge
              color={statusColors[ticket.status]}
              variant="light"
              leftSection={statusIcons[ticket.status]}
            >
              {t(`tickets.status.${ticket.status}`)}
            </Badge>
          </Group>
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              #{ticket.ticket_id} • {new Date(ticket.updated || ticket.created).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              {ticket.messages && ticket.messages.length > 0 && ` • ${ticket.messages.length} сообщ.`}
            </Text>
            <Badge color={priorityColors[ticket.priority]} size="xs" variant="dot">
              {t(`tickets.priority.${ticket.priority}`)}
            </Badge>
          </Group>
        </Card>
      </Indicator>
    );
  };

  if (loading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (tickets.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">{t('tickets.noTickets')}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="sm">
      {activeTickets.map(renderTicket)}

      {closedTickets.length > 0 && (
        <>
          <UnstyledButton
            onClick={() => setShowClosed(!showClosed)}
            style={{ width: '100%' }}
          >
            <Paper p="sm" withBorder radius="md" style={{ backgroundColor: 'var(--mantine-color-default-hover)' }}>
              <Group justify="space-between">
                <Group gap="xs">
                  {showClosed ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
                  <Text size="sm" c="dimmed" fw={500}>
                    {t('tickets.closedAndArchived')} ({closedTickets.length})
                  </Text>
                </Group>
                <Group gap={4}>
                  <IconArchive size={16} style={{ opacity: 0.5 }} />
                </Group>
              </Group>
            </Paper>
          </UnstyledButton>
          <Collapse in={showClosed}>
            <Stack gap="sm">
              {closedTickets.map(renderTicket)}
            </Stack>
          </Collapse>
        </>
      )}

      {activeTickets.length === 0 && closedTickets.length > 0 && !showClosed && (
        <Center py="md">
          <Text size="sm" c="dimmed">{t('tickets.noActiveTickets')}</Text>
        </Center>
      )}
    </Stack>
  );
}

function TicketDetail({
  ticket: initialTicket,
  onBack,
  onUpdate
}: {
  ticket: Ticket;
  onBack: () => void;
  onUpdate: () => void;
}) {
  const { t } = useTranslation();
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [messages, setMessages] = useState<TicketMessage[]>(initialTicket.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<MediaFile[]>([]);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(messages.length);
  const resetFileRef = useRef<() => void>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      scrollToBottom();
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  const loadTicketData = async () => {
    try {
      const response = await ticketApi.get(ticket.ticket_id);
      const ticketData = response.data?.data?.[0] || response.data?.data || response.data;
      if (ticketData) {
        setTicket(prev => ({
          ...prev,
          status: ticketData.status,
          priority: ticketData.priority,
          updated: ticketData.updated,
          closed_at: ticketData.closed_at,
        }));
        if (ticketData.messages) {
          setMessages(ticketData.messages);
        }
      }
    } catch (error) {
      console.error('Failed to load ticket data:', error);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [initialTicket.ticket_id]);

  useEffect(() => {
    const isClosed = ticket.status === 'closed' || ticket.status === 'archived';
    if (isClosed) return;

    const interval = setInterval(loadTicketData, 5000);
    return () => clearInterval(interval);
  }, [ticket.ticket_id, ticket.status]);

  const handleFileSelect = async (files: File[]) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    for (const file of files) {
      if (file.size > maxSize) {
        notifications.show({
          title: t('common.error'),
          message: t('tickets.fileTooLarge', { name: file.name }),
          color: 'red',
        });
        continue;
      }

      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isAllowedExt = allowedExtensions.includes(ext);
      const isAllowedType = imageTypes.includes(file.type) || file.type === 'application/pdf';

      if (!isAllowedExt && !isAllowedType) {
        notifications.show({
          title: t('common.error'),
          message: t('tickets.fileTypeNotAllowed', { name: file.name }),
          color: 'red',
        });
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
        }]);
      };
      reader.readAsDataURL(file);
    }
    resetFileRef.current?.();
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!newMessage.trim() && attachedFiles.length === 0) return;

    setSending(true);
    try {
      await ticketApi.sendMessage(
        ticket.ticket_id,
        newMessage || (attachedFiles.length > 0 ? '[Файл]' : ''),
        attachedFiles.length > 0 ? attachedFiles : undefined
      );
      setNewMessage('');
      setAttachedFiles([]);
      const response = await ticketApi.get(ticket.ticket_id);
      const ticketData = response.data?.data?.[0] || response.data?.data || response.data;
      if (ticketData?.messages) {
        setMessages(ticketData.messages);
      }
      onUpdate();
    } catch (error) {
      notifications.show({
        title: t('common.error'),
        message: t('tickets.sendError'),
        color: 'red',
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await ticketApi.close(ticket.ticket_id);
      notifications.show({
        title: t('common.success'),
        message: t('tickets.ticketClosed'),
        color: 'green',
      });
      onUpdate();
      onBack();
    } catch (error) {
      notifications.show({
        title: t('common.error'),
        message: t('tickets.closeError'),
        color: 'red',
      });
    } finally {
      setClosing(false);
    }
  };

  const isClosed = ticket.status === 'closed' || ticket.status === 'archived';

  return (
    <Box style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      position: 'relative'
    }}>
      <Paper p="md" withBorder style={{ flexShrink: 0 }}>
        <Group justify="space-between">
          <Group>
            <ActionIcon variant="subtle" onClick={onBack}>
              <IconArrowLeft size={20} />
            </ActionIcon>
            <div>
              <Text fw={500}>{ticket.subject}</Text>
              <Text size="xs" c="dimmed">
                #{ticket.ticket_id} • {new Date(ticket.created).toLocaleDateString()}
              </Text>
            </div>
          </Group>
          <Group>
            <Badge
              color={statusColors[ticket.status]}
              variant="light"
              leftSection={statusIcons[ticket.status]}
            >
              {t(`tickets.status.${ticket.status}`)}
            </Badge>
            <Badge color={priorityColors[ticket.priority]} size="sm" variant="dot">
              {t(`tickets.priority.${ticket.priority}`)}
            </Badge>
            {!isClosed && (
              <Button
                variant="light"
                color="gray"
                size="xs"
                leftSection={<IconX size={14} />}
                onClick={handleClose}
                loading={closing}
              >
                {t('tickets.closeTicket')}
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      <ScrollArea
        style={{ flex: 1, minHeight: 0 }}
        viewportRef={scrollAreaRef}
        offsetScrollbars
      >
        <Stack gap="md" p="md">
          {messages.map((msg) => (
            <Box
              key={msg.message_id}
              style={{
                alignSelf: msg.is_admin ? 'flex-start' : 'flex-end',
                maxWidth: '80%',
              }}
            >
              <Paper
                p="sm"
                radius="md"
                bg={msg.is_admin ? 'var(--mantine-color-gray-light)' : 'var(--mantine-color-blue-light)'}
              >
                {msg.media && msg.media.length > 0 && (
                  <Stack gap="xs" mb="xs">
                    {msg.media.map((file, idx) => {
                      const isImage = file.type?.startsWith('image/');
                      const dataUrl = file.url || (file.data ? `data:${file.type};base64,${file.data}` : null);

                      if (isImage && dataUrl) {
                        return (
                          <Image
                            key={idx}
                            src={dataUrl}
                            alt={file.name}
                            radius="sm"
                            maw={300}
                          />
                        );
                      }

                      return (
                        <Group key={idx} gap="xs" p="xs" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 'var(--mantine-radius-sm)' }}>
                          <IconFile size={20} />
                          <Text size="sm" style={{ wordBreak: 'break-all' }}>{file.name}</Text>
                        </Group>
                      );
                    })}
                  </Stack>
                )}
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.message !== '[Файл]' ? msg.message : ''}
                </Text>
                <Text size="xs" c="dimmed" ta="right" mt={4}>
                  {new Date(msg.created).toLocaleString()}
                </Text>
              </Paper>
            </Box>
          ))}
        </Stack>
      </ScrollArea>

      {!isClosed && (
        <Paper p="md" withBorder style={{ flexShrink: 0 }}>
          {attachedFiles.length > 0 && (
            <Group gap="xs" mb="sm" wrap="wrap">
              {attachedFiles.map((file, index) => {
                const isImage = file.type.startsWith('image/');
                return (
                  <Paper key={index} p="xs" withBorder radius="sm" style={{ position: 'relative' }}>
                    <CloseButton
                      size="xs"
                      style={{ position: 'absolute', top: 2, right: 2, zIndex: 1 }}
                      onClick={() => removeFile(index)}
                    />
                    {isImage ? (
                      <Image
                        src={`data:${file.type};base64,${file.data}`}
                        alt={file.name}
                        w={60}
                        h={60}
                        fit="cover"
                        radius="sm"
                      />
                    ) : (
                      <Group gap={4} p="xs">
                        <IconFile size={16} />
                        <Text size="xs" lineClamp={1} style={{ maxWidth: 80 }}>{file.name}</Text>
                      </Group>
                    )}
                  </Paper>
                );
              })}
            </Group>
          )}
          <Group align="flex-end" gap="xs">
            <FileButton
              onChange={(files) => files && handleFileSelect(files)}
              accept="image/*,application/pdf"
              multiple
              resetRef={resetFileRef}
            >
              {(props) => (
                <Tooltip label={t('tickets.attachFile')}>
                  <ActionIcon size="lg" variant="subtle" {...props}>
                    <IconPaperclip size={18} />
                  </ActionIcon>
                </Tooltip>
              )}
            </FileButton>
            <Textarea
              placeholder={t('tickets.messagePlaceholder')}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ flex: 1 }}
              minRows={1}
              maxRows={4}
              autosize
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <ActionIcon
              size="lg"
              variant="filled"
              onClick={handleSend}
              loading={sending}
              disabled={!newMessage.trim() && attachedFiles.length === 0}
            >
              <IconSend size={18} />
            </ActionIcon>
          </Group>
        </Paper>
      )}
    </Box>
  );
}

function CreateTicketModal({
  opened,
  onClose,
  onCreated,
}: {
  opened: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<string>('normal');
  const [ticketType, setTicketType] = useState<string>('other');
  const [userServiceId, setUserServiceId] = useState<string | null>(null);
  const [userServices, setUserServices] = useState<UserService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (opened) {
      setLoadingServices(true);
      userApi.getServices()
        .then(res => {
          const services = res.data?.data || [];
          setUserServices(services);
        })
        .catch(() => setUserServices([]))
        .finally(() => setLoadingServices(false));
    }
  }, [opened]);

  useEffect(() => {
    if (ticketType !== 'service') {
      setUserServiceId(null);
    }
  }, [ticketType]);

  const ticketTypeOptions = [
    { value: 'service', label: t('tickets.ticketType.service') },
    { value: 'payment', label: t('tickets.ticketType.payment') },
    { value: 'other', label: t('tickets.ticketType.other') },
  ];

  const priorityOptions = [
    { value: 'low', label: t('tickets.priority.low') },
    { value: 'normal', label: t('tickets.priority.normal') },
    { value: 'high', label: t('tickets.priority.high') },
    { value: 'urgent', label: t('tickets.priority.urgent') },
  ];

  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) {
      notifications.show({
        title: t('common.error'),
        message: t('tickets.fillRequired'),
        color: 'red',
      });
      return;
    }

    setCreating(true);
    try {
      await ticketApi.create({
        subject: subject.trim(),
        message: message.trim(),
        priority: priority,
        ticket_type: ticketType,
        user_service_id: userServiceId ? parseInt(userServiceId) : undefined,
      });
      notifications.show({
        title: t('common.success'),
        message: t('tickets.ticketCreated'),
        color: 'green',
      });
      setSubject('');
      setMessage('');
      setPriority('normal');
      setTicketType('other');
      setUserServiceId(null);
      onClose();
      onCreated();
    } catch (error) {
      notifications.show({
        title: t('common.error'),
        message: t('tickets.createError'),
        color: 'red',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('tickets.createTicket')}
      size="md"
    >
      <Stack>
        <Select
          label={t('tickets.ticketTypeLabel')}
          data={ticketTypeOptions}
          value={ticketType}
          onChange={(val) => setTicketType(val || 'other')}
          required
        />
        {ticketType === 'service' && loadingServices && (
          <Center py="xs">
            <Loader size="sm" />
          </Center>
        )}
        {ticketType === 'service' && !loadingServices && userServices.filter(s => !s.parent).length === 0 && (
          <Text size="sm" c="dimmed">{t('tickets.noServices')}</Text>
        )}
        {ticketType === 'service' && !loadingServices && userServices.filter(s => !s.parent).length > 0 && (
          <Select
            label={t('tickets.selectService')}
            placeholder={t('tickets.selectServicePlaceholder')}
            data={userServices
              .filter(s => !s.parent)
              .map(s => ({
                value: String(s.user_service_id),
                label: `#${s.user_service_id} - ${s.service.name} (${t('status.' + s.status)})`
              }))}
            value={userServiceId}
            onChange={setUserServiceId}
            clearable
            searchable
          />
        )}
        <TextInput
          label={t('tickets.subject')}
          placeholder={t('tickets.subjectPlaceholder')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <Select
          label={t('tickets.priorityLabel')}
          data={priorityOptions}
          value={priority}
          onChange={(val) => setPriority(val || 'normal')}
        />
        <Textarea
          label={t('tickets.message')}
          placeholder={t('tickets.messagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minRows={4}
          required
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreate} loading={creating}>
            {t('tickets.send')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default function Tickets() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const { lastTicketCheck, setLastTicketCheck } = useStore();

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await ticketApi.list();
      setTickets(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setLastTicketCheck(Date.now());
  };

  const handleBack = () => {
    setSelectedTicket(null);
    loadTickets();
  };

  if (selectedTicket) {
    return (
      <TicketDetail
        ticket={selectedTicket}
        onBack={handleBack}
        onUpdate={loadTickets}
      />
    );
  }

  return (
    <Stack h="100%">
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('tickets.title')}</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreateModal}
        >
          {t('tickets.createTicket')}
        </Button>
      </Group>

      <TicketList
        tickets={tickets}
        onSelect={handleTicketSelect}
        loading={loading}
        lastTicketCheck={lastTicketCheck}
      />

      <CreateTicketModal
        opened={createModalOpened}
        onClose={closeCreateModal}
        onCreated={loadTickets}
      />
    </Stack>
  );
}

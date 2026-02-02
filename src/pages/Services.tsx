import { useState, useEffect, useRef } from 'react';
import { Card, Text, Stack, Group, Badge, Button, Modal, ActionIcon, Loader, Center, Paper, Title, Tabs, Code, CopyButton, Tooltip, Accordion, Box } from '@mantine/core';
import { IconQrcode, IconCopy, IconCheck, IconDownload, IconRefresh, IconTrash, IconPlus, IconPlayerStop } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { api, userApi } from '../api/client';
import { notifications } from '@mantine/notifications';
import QrModal from '../components/QrModal';
import OrderServiceModal from '../components/OrderServiceModal';
import ConfirmModal from '../components/ConfirmModal';

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

const statusColors: Record<string, string> = {
  'ACTIVE': 'green',
  'NOT PAID': 'blue',
  'BLOCK': 'red',
  'PROGRESS': 'yellow',
  'ERROR': 'orange',
  'INIT': 'gray',
};

function normalizeCategory(category: string): string {
  if (category.match(/remna|remnawave|marzban|marz|mz/i)) {
    return 'proxy';
  }
  if (category.match(/^(vpn|wg|awg)/i)) {
    return 'vpn';
  }
  if (['web_tariff', 'web', 'mysql', 'mail', 'hosting'].includes(category)) {
    return category;
  }
  return 'other';
}

interface ServiceDetailProps {
  service: UserService;
  onDelete?: () => void;
}

function ServiceDetail({ service, onDelete }: ServiceDetailProps) {
  const [storageData, setStorageData] = useState<string | null>(null);
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);
  const [, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('info');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { t, i18n } = useTranslation();

  const downloadConfig = async () => {
    if (!storageData) return;
    setDownloading(true);
    try {
      const blob = new Blob([storageData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vpn${service.user_service_id}.conf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const canDelete = ['BLOCK', 'NOT PAID', 'ERROR'].includes(service.status);
  const canStop = service.status === 'ACTIVE';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/user/service?user_service_id=${service.user_service_id}`);
      notifications.show({
        title: t('common.success'),
        message: t('services.serviceDeleted'),
        color: 'green',
      });
      setConfirmDelete(false);
      onDelete?.();
    } catch (error) {
      notifications.show({
        title: t('common.error'),
        message: t('services.serviceDeleteError'),
        color: 'red',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await userApi.stopService(service.user_service_id);
      notifications.show({
        title: t('common.success'),
        message: t('services.serviceStopped'),
        color: 'green',
      });
      setConfirmStop(false);
      onDelete?.();
    } catch (error) {
      notifications.show({
        title: t('common.error'),
        message: t('services.serviceStopError'),
        color: 'red',
      });
    } finally {
      setStopping(false);
    }
  };

  const category = normalizeCategory(service.service.category);

  useEffect(() => {
    const fetchData = async () => {
      if (category === 'proxy') {
        try {
          const mzResponse = await api.get(`/storage/manage/vpn_mrzb_${service.user_service_id}?format=json`);
          const url = mzResponse.data.subscription_url || mzResponse.data.response?.subscriptionUrl;
          if (url) {
            setSubscriptionUrl(url);
          }
          setActiveTab('config');
        } catch {
          try {
            const remnaResponse = await api.get(`/storage/manage/vpn_remna_${service.user_service_id}?format=json`);
            const url = remnaResponse.data.subscription_url || remnaResponse.data.response?.subscriptionUrl;
            if (url) {
              setSubscriptionUrl(url);
            }
          } catch {
          }
        }
      } else if (category === 'vpn') {
        try {
          const vpnResponse = await api.get(`/storage/manage/vpn${service.user_service_id}`);
          const configData = vpnResponse.data;
          if (configData) {
            setStorageData(configData);
          }
          setActiveTab('config');
        } catch {
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [service.user_service_id, category]);

  const isVpn = category === 'vpn';
  const isProxy = category === 'proxy';
  const isVpnOrProxy = isVpn || isProxy;
  const statusColor = statusColors[service.status] || 'gray';
  const statusLabel = t(`status.${service.status}`, service.status);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Text fw={700} size="lg">{service.service.name}</Text>
          <Badge color={statusColor} variant="light">
            {statusLabel}
          </Badge>
        </div>
        <Text size="sm" c="dimmed">ID: {service.user_service_id}</Text>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="info">{t('services.info')}</Tabs.Tab>
          {isVpnOrProxy && service.status === 'ACTIVE' && <Tabs.Tab value="config">{t('services.connection')}</Tabs.Tab>}
        </Tabs.List>

        <Tabs.Panel value="info" pt="md">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{t('services.status')}:</Text>
              <Badge color={statusColor} variant="light">{statusLabel}</Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{t('services.cost')}:</Text>
              <Text size="sm">{service.service.cost} {t('common.currency')}</Text>
            </Group>
            {service.expire && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">{t('services.validUntil')}:</Text>
                <Text size="sm">{new Date(service.expire as string).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US')}</Text>
              </Group>
            )}
            {service.children && service.children.length > 0 && (
              <>
                <Text size="sm" c="dimmed" mt="md">{t('services.includedServices')}:</Text>
                {service.children.map((child) => {
                  const childStatusColor = statusColors[child.status] || 'gray';
                  const childStatusLabel = t(`status.${child.status}`, child.status);
                  return (
                    <Group key={child.user_service_id} justify="space-between" ml="md">
                      <Text size="sm">{child.service.name}</Text>
                      <Badge size="sm" color={childStatusColor} variant="light">{childStatusLabel}</Badge>
                    </Group>
                  );
                })}
              </>
            )}
          </Stack>
        </Tabs.Panel>

        { service.status === 'ACTIVE' && (
          <Tabs.Panel value="config" pt="md">
            <Stack gap="md">
              {isProxy && subscriptionUrl && (
                <Paper withBorder p="md" radius="md">
                  <Text size="sm" fw={500} mb="xs">{t('services.subscriptionLink')}</Text>
                  <Group gap="xs">
                    <Code style={{ flex: 1, wordBreak: 'break-all' }}>{subscriptionUrl}</Code>
                    <CopyButton value={subscriptionUrl}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? t('common.copied') : t('common.copy')}>
                          <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </Group>
                </Paper>
              )}

              <Group>
                {(isVpn && storageData) || (isProxy && subscriptionUrl) ? (
                  <Button
                    leftSection={<IconQrcode size={16} />}
                    variant="light"
                    onClick={() => setQrModalOpen(true)}
                  >
                    {t('services.qrCode')}
                  </Button>
                ) : null}

              {isVpn && storageData && (
                <Button
                  leftSection={<IconDownload size={16} />}
                  variant="light"
                  onClick={downloadConfig}
                  loading={downloading}
                >
                  {t('services.downloadConfig')}
                </Button>
              )}
              </Group>

              <QrModal
                opened={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                data={isVpn ? (storageData || '') : (subscriptionUrl || '')}
                title={isVpn ? t('services.vpnQrTitle') : t('services.subscriptionQrTitle')}
                onDownload={isVpn ? downloadConfig : undefined}
              />
            </Stack>
          </Tabs.Panel>
        )}
      </Tabs>

      {canStop && (
        <Button
          color="orange"
          variant="light"
          leftSection={<IconPlayerStop size={16} />}
          onClick={() => setConfirmStop(true)}
          mt="md"
          fullWidth
        >
          {t('services.stopService')}
        </Button>
      )}

      {canDelete && (
        <Button
          color="red"
          variant="light"
          leftSection={<IconTrash size={16} />}
          onClick={() => setConfirmDelete(true)}
          mt="md"
          fullWidth
        >
          {t('services.deleteService')}
        </Button>
      )}

      <ConfirmModal
        opened={confirmStop}
        onClose={() => setConfirmStop(false)}
        onConfirm={handleStop}
        title={t('services.stopServiceTitle')}
        message={t('services.stopServiceMessage')}
        confirmLabel={t('services.stop')}
        confirmColor="orange"
        loading={stopping}
      />

      <ConfirmModal
        opened={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={t('services.deleteServiceTitle')}
        message={t('services.deleteServiceMessage')}
        confirmLabel={t('common.delete')}
        confirmColor="red"
        loading={deleting}
      />
    </Stack>
  );
}

function ServiceCard({ service, onClick, isChild = false, isLastChild = false }: { service: UserService; onClick: () => void; isChild?: boolean; isLastChild?: boolean }) {
  const { t, i18n } = useTranslation();
  const statusColor = statusColors[service.status] || 'gray';
  const statusLabel = t(`status.${service.status}`, service.status);

  if (isChild) {
    return (
      <Group gap={0} wrap="nowrap" align="stretch">
        <Box
          style={{
            width: 24,
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <Box
            style={{
              position: 'absolute',
              left: 10,
              top: 0,
              bottom: isLastChild ? '50%' : 0,
              width: 2,
              backgroundColor: 'var(--mantine-color-gray-4)',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              width: 14,
              height: 2,
              backgroundColor: 'var(--mantine-color-gray-4)',
            }}
          />
        </Box>
        <Card
          withBorder
          radius="md"
          p="sm"
          style={{ cursor: 'pointer', flex: 1 }}
          onClick={onClick}
        >
          <Group justify="space-between">
            <div>
              <Text fw={500} size="sm">{service.service.name}</Text>
              {service.expire && (
                <Text size="xs" c="dimmed">
                  {new Date(service.expire as string).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US')}
                </Text>
              )}
            </div>
            <Group gap="sm">
              {service.service.cost > 0 && (
                <Text size="sm" c="dimmed">{service.service.cost} {t('common.currency')}</Text>
              )}
              <Badge color={statusColor} variant="light" size="sm">
                {statusLabel}
              </Badge>
            </Group>
          </Group>
        </Card>
      </Group>
    );
  }

  return (
    <Card
      withBorder
      radius="md"
      p="md"
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      <Group justify="space-between">
        <div>
          <Text fw={500}>{service.service.name}</Text>
          {service.expire && (
            <Text size="xs" c="dimmed">
              {new Date(service.expire as string).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US')}
            </Text>
          )}
        </div>
        <Group gap="sm">
          {service.service.cost > 0 && (
            <Text size="sm" c="dimmed">{service.service.cost} {t('common.currency')}</Text>
          )}
          <Badge color={statusColor} variant="light">
            {statusLabel}
          </Badge>
        </Group>
      </Group>
    </Card>
  );
}

export default function Services() {
  const [services, setServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<UserService | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [orderModalOpened, { open: openOrderModal, close: closeOrderModal }] = useDisclosure(false);
  const refreshAttemptsRef = useRef(0);
  const { t } = useTranslation();

  const fetchServices = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const response = await api.get('/user/service');
      const data: UserService[] = response.data.data || [];

      const serviceMap = new Map<number, UserService>();
      data.forEach(s => serviceMap.set(s.user_service_id, { ...s, children: [] }));

      const rootServices: UserService[] = [];
      serviceMap.forEach(service => {
        if (service.parent && serviceMap.has(service.parent)) {
          const parent = serviceMap.get(service.parent)!;
          parent.children = parent.children || [];
          parent.children.push(service);
        } else if (!service.parent) {
          rootServices.push(service);
        }
      });

      setServices(rootServices);
      return rootServices;
    } catch (error) {
      console.error('Failed to fetch services:', error);
      return [];
    } finally {
      if (!background) setLoading(false);
    }
  };

  const hasProgressServices = (serviceList: UserService[]): boolean => {
    for (const service of serviceList) {
      if (service.status === 'PROGRESS') return true;
      if (service.children && hasProgressServices(service.children)) return true;
    }
    return false;
  };

  const hasNotPaidServices = (serviceList: UserService[]): boolean => {
    for (const service of serviceList) {
      if (service.status === 'NOT PAID') return true;
      if (service.children && hasNotPaidServices(service.children)) return true;
    }
    return false;
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (!services.length || loading) return;

    const hasProgress = hasProgressServices(services);

    if (hasProgress && refreshAttemptsRef.current < 2) {
      const delay = refreshAttemptsRef.current === 0 ? 1000 : 3000;
      const timer = setTimeout(async () => {
        refreshAttemptsRef.current += 1;
        await fetchServices(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    if (!hasProgress) {
      refreshAttemptsRef.current = 0;
    }
  }, [services, loading]);

  useEffect(() => {
    if (!services.length || loading) return;

    const hasNotPaid = hasNotPaidServices(services);
    if (!hasNotPaid) return;

    const interval = setInterval(() => {
      fetchServices(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [services, loading]);

  const handleServiceClick = (service: UserService) => {
    setSelectedService(service);
    open();
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = normalizeCategory(service.service.category);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, UserService[]>);

  if (loading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>{t('services.title')}</Title>
        <Group>
          <Button leftSection={<IconPlus size={16} />} onClick={openOrderModal}>
            {t('services.orderService')}
          </Button>
          <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={() => fetchServices()}>
            {t('common.refresh')}
          </Button>
        </Group>
      </Group>

      {services.length === 0 ? (
        <Paper withBorder p="xl" radius="md">
          <Center>
            <Stack align="center" gap="md">
              <Text c="dimmed">{t('services.noServices')}</Text>
              <Button leftSection={<IconPlus size={16} />} onClick={openOrderModal}>
                {t('services.orderService')}
              </Button>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Accordion variant="separated" radius="md" multiple defaultValue={Object.keys(groupedServices)}>
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <Accordion.Item key={category} value={category}>
              <Accordion.Control>
                <Group>
                  <Text fw={500}>{t(`categories.${category}`, category)}</Text>
                  <Badge variant="light" size="sm">{categoryServices.length}</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  {categoryServices.map((service) => (
                    <Box key={service.user_service_id}>
                      <ServiceCard
                        service={service}
                        onClick={() => handleServiceClick(service)}
                      />
                      {service.children && service.children.length > 0 && (
                        <Stack gap="xs" mt="xs" ml="md">
                          {service.children.map((child, index) => (
                            <ServiceCard
                              key={child.user_service_id}
                              service={child}
                              onClick={() => handleServiceClick(child)}
                              isChild
                              isLastChild={index === service.children!.length - 1}
                            />
                          ))}
                        </Stack>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}

      <Modal opened={opened} onClose={close} title={t('services.serviceDetails')} size="lg">
        {selectedService && (
          <ServiceDetail
            service={selectedService}
            onDelete={() => {
              close();
              refreshAttemptsRef.current = 0;
              fetchServices();
            }}
          />
        )}
      </Modal>

      <OrderServiceModal
        opened={orderModalOpened}
        onClose={closeOrderModal}
        onOrderSuccess={() => {
          refreshAttemptsRef.current = 0;
          fetchServices();
        }}
      />
    </Stack>
  );
}
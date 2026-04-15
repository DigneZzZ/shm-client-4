import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Title,
  Group,
  Text,
  Box,
  Button,
  Card,
  Badge,
  Loader,
  Center,
  Container,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconClock,
  IconArrowRight,
  IconShieldLock,
  IconExchange,
  IconCopy,
  IconCheck,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { api, userApi } from '../api/client';
import { useStore } from '../store/useStore';
import { config } from '../config';
import { encodePartnerIdBase64url } from '../api/cookie';
import { isTelegramWebApp } from '../constants/webapp';
import { normalizeCategory } from '../utils/services';
import BalanceCard from '../components/BalanceCard';
import { PromoCard } from '../components/DashboardCards';
import PayModal from '../components/PayModal';
import PromoModal from '../components/PromoModal';
import { IconLink } from '@tabler/icons-react';

interface UserService {
  user_service_id: number;
  service: { name: string; category: string };
  status: string;
  expire: string | null;
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useStore();
  const [services, setServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const clipboardLink = useClipboard({ timeout: 1500 });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response = await userApi.getServices();
        if (!alive) return;
        const raw: UserService[] = response.data.data || [];
        setServices(raw);
      } catch {
        /* empty state */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const activeService = services
    .filter((s) => s.status === 'ACTIVE' || s.status === 'NOT PAID' || s.status === 'PROGRESS')
    .sort((a, b) => {
      const ea = a.expire ? new Date(a.expire).getTime() : Infinity;
      const eb = b.expire ? new Date(b.expire).getTime() : Infinity;
      return ea - eb;
    })[0];

  const basePath = config.SHM_BASE_PATH && config.SHM_BASE_PATH !== '/' ? config.SHM_BASE_PATH : '';
  const partnerLink = `${window.location.origin}${basePath}?partner_id=${encodePartnerIdBase64url(user?.user_id || 0)}`;

  const daysLeft = (iso: string | null): number | null => {
    if (!iso) return null;
    const diff = new Date(iso).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const formatDate = (iso: string | null): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  /** Fetches subscription URL / VPN config for the given service and opens it in a new tab (or Telegram WebApp). */
  const handleConnect = async (service: UserService) => {
    setConnecting(true);
    try {
      const category = normalizeCategory(service.service.category);
      let link = '';

      if (category === 'proxy') {
        const prefix = config.PROXY_STORAGE_PREFIX || 'vpn_mrzb_';
        try {
          const r = await api.get(`/storage/manage/${prefix}${service.user_service_id}?format=json`);
          link = r.data.subscription_url || r.data.response?.subscriptionUrl || '';
        } catch { /* fallthrough */ }
        if (!link) {
          try {
            const r = await api.get(`/storage/manage/vpn_remna_${service.user_service_id}?format=json`);
            link = r.data.subscription_url || r.data.response?.subscriptionUrl || '';
          } catch { /* ignore */ }
        }
      } else if (category === 'vpn') {
        // VPN configs are raw text, not URLs — fall back to the detailed page.
        navigate('/services');
        return;
      }

      if (!link) {
        notifications.show({
          title: t('common.error'),
          message: t('services.qrTooLongDesc'),
          color: 'orange',
        });
        return;
      }

      const tg = window.Telegram?.WebApp;
      if (tg && isTelegramWebApp) {
        tg.openLink(link);
      } else {
        window.open(link, '_blank');
      }
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Container size="sm" px={0}>
      <Stack gap="lg">
        <Title order={2}>{t('nav.home', 'Главная')}</Title>

        <BalanceCard balance={user?.balance ?? 0} onTopUp={() => setPayOpen(true)} />

        {activeService ? (
          <Card p="md" radius="lg">
            <Group justify="space-between" wrap="nowrap">
              <Box style={{ minWidth: 0 }}>
                <Text fw={700} fz={18} c="var(--shm-text-primary, #fff)">
                  #{activeService.user_service_id} - {activeService.service.name}
                </Text>
                <Group gap={6} mt={4}>
                  <IconClock size={14} color="rgba(255,255,255,0.48)" />
                  <Text size="sm" c="var(--shm-text-muted, rgba(255,255,255,0.48))">
                    {daysLeft(activeService.expire) !== null
                      ? `${daysLeft(activeService.expire)} ${t('common.days')} • ${formatDate(activeService.expire)}`
                      : formatDate(activeService.expire)}
                  </Text>
                </Group>
              </Box>
              <Badge
                color="green"
                variant="light"
                className={activeService.status === 'ACTIVE' ? 'shm-pill-success' : undefined}
                size="lg"
              >
                {t(`status.${activeService.status}`, activeService.status)}
              </Badge>
            </Group>

            <Button
              fullWidth
              size="md"
              leftSection={<IconShieldLock size={18} />}
              mt="md"
              loading={connecting}
              style={{
                height: 52,
                background: 'var(--shm-grad-cta, linear-gradient(90deg,#10B981 0%,#0891B2 100%))',
                color: '#fff',
                border: 'none',
              }}
              onClick={() => handleConnect(activeService)}
            >
              {t('services.connection')}
            </Button>

            <Button
              variant="default"
              leftSection={<IconExchange size={16} />}
              onClick={() => navigate('/services')}
              mt="sm"
              fullWidth
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#fff',
              }}
            >
              {t('services.changeService')}
            </Button>
          </Card>
        ) : (
          <Card p="lg" radius="lg">
            <Center>
              <Stack align="center" gap="xs">
                <Text fw={700} fz={18} c="var(--shm-text-primary, #fff)">
                  {t('services.noServices')}
                </Text>
                <Button
                  mt="xs"
                  rightSection={<IconArrowRight size={16} />}
                  style={{
                    background: 'var(--shm-grad-cta, linear-gradient(90deg,#10B981 0%,#0891B2 100%))',
                    color: '#fff',
                    border: 'none',
                  }}
                  onClick={() => navigate('/services')}
                >
                  {t('services.orderService')}
                </Button>
              </Stack>
            </Center>
          </Card>
        )}

        <PromoCard onClick={() => setPromoOpen(true)} />

        <Card p="md" radius="lg">
          <Group gap="md" wrap="nowrap" align="flex-start">
            <Box
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255,181,71,0.18)',
                color: '#FFB547',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconLink size={20} />
            </Box>
            <Box style={{ minWidth: 0, flex: 1 }}>
              <Text fw={600} c="var(--shm-text-primary, #fff)">
                {t('profile.partnerLink')}
              </Text>
              <Text
                size="sm"
                c="var(--shm-text-muted, rgba(255,255,255,0.48))"
                mt={4}
                style={{ wordBreak: 'break-all', fontFamily: 'ui-monospace, monospace' }}
              >
                {partnerLink}
              </Text>
              <Text size="xs" c="var(--shm-text-muted, rgba(255,255,255,0.36))" mt="xs">
                {t('profile.partnerLinkDescription')}
              </Text>
            </Box>
            <Tooltip label={clipboardLink.copied ? t('common.success') : t('services.qrCode', 'Copy')} withArrow>
              <ActionIcon
                variant="subtle"
                color={clipboardLink.copied ? 'teal' : 'gray'}
                onClick={() => clipboardLink.copy(partnerLink)}
                aria-label="Copy partner link"
              >
                {clipboardLink.copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Card>

        <PayModal opened={payOpen} onClose={() => setPayOpen(false)} />
        <PromoModal opened={promoOpen} onClose={() => setPromoOpen(false)} />
      </Stack>
    </Container>
  );
}

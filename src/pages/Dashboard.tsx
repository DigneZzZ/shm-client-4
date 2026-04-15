import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Title, Group, Text, Box, Button, Card, Badge, Loader, Center } from '@mantine/core';
import { IconClock, IconArrowRight, IconShieldLock, IconExchange } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { userApi } from '../api/client';
import { useStore } from '../store/useStore';
import { config } from '../config';
import { encodePartnerIdBase64url } from '../api/cookie';
import BalanceCard from '../components/BalanceCard';
import { PromoCard, ReferralCard } from '../components/DashboardCards';
import PayModal from '../components/PayModal';
import PromoModal from '../components/PromoModal';

interface UserService {
  user_service_id: number;
  service: { name: string; category: string };
  status: string;
  expire: string | null;
}

interface WithdrawalTotals {
  total: number;
  count: number;
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useStore();
  const [services, setServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [referralTotals, setReferralTotals] = useState<WithdrawalTotals>({ total: 0, count: 0 });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const response = await userApi.getServices();
        if (!alive) return;
        const raw: UserService[] = response.data.data || [];
        setServices(raw);
      } catch {
        /* ignore — show empty state */
      } finally {
        if (alive) setLoading(false);
      }
    })();

    (async () => {
      try {
        const response = await userApi.getWithdrawals({ limit: 1000 });
        if (!alive) return;
        const items: Array<{ total?: number; amount?: number }> = response.data.data || [];
        const total = items.reduce((sum, w) => sum + Number(w.total ?? w.amount ?? 0), 0);
        setReferralTotals({ total, count: items.length });
      } catch {
        /* ignore — partner API may be absent */
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

  if (loading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Title order={2}>{t('nav.home', 'Главная')}</Title>

      <BalanceCard balance={user?.balance ?? 0} onTopUp={() => setPayOpen(true)} />

      {activeService ? (
        <Card p="md" radius="lg">
          <Group justify="space-between" wrap="nowrap">
            <Box style={{ minWidth: 0 }}>
              <Text fw={700} fz={18} c="var(--shm-text-primary, #fff)">
                {activeService.service.name}
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
            style={{
              height: 52,
              background: 'var(--shm-grad-cta, linear-gradient(90deg,#6A4BFF 0%,#3E8BFF 100%))',
              color: '#fff',
              border: 'none',
            }}
            onClick={() => navigate('/services')}
          >
            {t('services.connection')}
          </Button>

          <Group mt="sm" gap="sm">
            <Button
              variant="default"
              leftSection={<IconExchange size={16} />}
              onClick={() => navigate('/services')}
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}
            >
              {t('services.changeService')}
            </Button>
          </Group>
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
                  background: 'var(--shm-grad-cta, linear-gradient(90deg,#6A4BFF 0%,#3E8BFF 100%))',
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

      <ReferralCard
        partnerLink={partnerLink}
        invitedCount={referralTotals.count}
        earned={referralTotals.total}
      />

      <PayModal opened={payOpen} onClose={() => setPayOpen(false)} />
      <PromoModal opened={promoOpen} onClose={() => setPromoOpen(false)} />
    </Stack>
  );
}

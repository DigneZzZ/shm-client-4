import { ReactNode } from 'react';
import { Box, Group, Text, UnstyledButton, SimpleGrid } from '@mantine/core';
import { IconChevronRight, IconTicket, IconLink, IconUsers, IconCoin } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface IconTileProps {
  color: string;
  background: string;
  children: ReactNode;
}

function IconTile({ color, background, children }: IconTileProps) {
  return (
    <Box
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
}

interface ActionCardProps {
  title: string;
  description?: string;
  icon: ReactNode;
  iconColor: string;
  iconBg: string;
  onClick?: () => void;
  trailing?: ReactNode;
}

function ActionCard({ title, description, icon, iconColor, iconBg, onClick, trailing }: ActionCardProps) {
  return (
    <UnstyledButton
      onClick={onClick}
      className="shm-glass"
      style={{
        display: 'block',
        width: '100%',
        borderRadius: 20,
        padding: 16,
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
          <IconTile color={iconColor} background={iconBg}>
            {icon}
          </IconTile>
          <Box style={{ minWidth: 0 }}>
            <Text fw={600} c="var(--shm-text-primary, #fff)">{title}</Text>
            {description && (
              <Text size="sm" c="var(--shm-text-muted, rgba(255,255,255,0.48))" mt={2}>
                {description}
              </Text>
            )}
          </Box>
        </Group>
        {trailing ?? <IconChevronRight size={18} color="rgba(255,255,255,0.48)" />}
      </Group>
    </UnstyledButton>
  );
}

interface PromoCardProps {
  onClick?: () => void;
}

export function PromoCard({ onClick }: PromoCardProps) {
  const { t } = useTranslation();
  return (
    <ActionCard
      title={t('promo.title')}
      description={t('promo.placeholder', 'Активировать промокод или купон')}
      icon={<IconTicket size={20} />}
      iconColor="#6EE7B7"
      iconBg="rgba(16,185,129,0.18)"
      onClick={onClick}
    />
  );
}

interface ReferralCardProps {
  partnerLink: string;
  invitedCount?: number;
  earned?: number;
  currency?: string;
  onClick?: () => void;
}

export function ReferralCard({ partnerLink, invitedCount = 0, earned = 0, currency = '₽', onClick }: ReferralCardProps) {
  const { t } = useTranslation();

  const formattedEarned = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(earned);

  return (
    <Box
      className="shm-glass"
      style={{ borderRadius: 20, padding: 16 }}
    >
      <Group justify="space-between" wrap="nowrap" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
          <IconTile color="#FFB547" background="rgba(255,181,71,0.18)">
            <IconLink size={20} />
          </IconTile>
          <Box style={{ minWidth: 0 }}>
            <Text fw={600} c="var(--shm-text-primary, #fff)">{t('profile.partnerLink')}</Text>
            <Text size="sm" c="var(--shm-text-muted, rgba(255,255,255,0.48))" mt={2} truncate>
              {partnerLink}
            </Text>
          </Box>
        </Group>
      </Group>

      <SimpleGrid cols={2} spacing="sm" mt="md">
        <Box
          style={{
            padding: 12,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Group gap={8} wrap="nowrap">
            <IconUsers size={18} color="#B9A3FF" />
            <Box>
              <Text fw={700} fz={20} c="var(--shm-text-primary, #fff)">{invitedCount}</Text>
              <Text size="xs" c="var(--shm-text-muted, rgba(255,255,255,0.48))" tt="uppercase">
                {t('profile.referralInvited', 'Приглашено')}
              </Text>
            </Box>
          </Group>
        </Box>
        <Box
          style={{
            padding: 12,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Group gap={8} wrap="nowrap">
            <IconCoin size={18} color="#2ED687" />
            <Box>
              <Text fw={700} fz={20} c="#2ED687">
                {formattedEarned} {currency}
              </Text>
              <Text size="xs" c="var(--shm-text-muted, rgba(255,255,255,0.48))" tt="uppercase">
                {t('profile.referralEarned', 'Заработано')}
              </Text>
            </Box>
          </Group>
        </Box>
      </SimpleGrid>
    </Box>
  );
}

import { useState } from 'react';
import { Card, Text, Stack, Group, Button, Modal, Space, PasswordInput, Tabs } from '@mantine/core';
import { IconShieldLock, IconLock, IconShield, IconFingerprint, IconKey } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../api/client';
import PasskeySettings from './PasskeySettings';
import OtpSettings from './OtpSettings';
import PasswordAuthSettings from './PasswordAuthSettings';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { config } from '../../config';

const otpEnabled = config.OTP_ENABLE === 'true';
const passkeyEnabled = config.PASSKEY_ENABLE === 'true';

export default function SecuritySettings() {
  const { t } = useTranslation();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('password');
  const { isInsideTelegramWebApp } = useTelegramWebApp();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleChangePassword = async () => {
    if (!newPassword) {
      notifications.show({
        title: t('common.error'),
        message: t('profile.enterNewPassword'),
        color: 'red',
      });
      return;
    }
    try {
      await userApi.changePassword(newPassword);
      setPasswordModalOpen(false);
      setNewPassword('');
      notifications.show({
        title: t('common.success'),
        message: t('profile.passwordChanged'),
        color: 'green',
      });
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('profile.passwordChangeError'),
        color: 'red',
      });
    }
  };

  const hasTelegramWidget = !isInsideTelegramWebApp;


  return (
    <>
      <Card withBorder radius="md" p="lg">
        <Group gap="xs" mb="lg">
          <IconShieldLock size={24} />
          <Text fw={600} size="lg">{t('profile.security')}</Text>
        </Group>

        <Tabs defaultValue={'password'} variant="outline" value={activeTab} onChange={setActiveTab}>
          <Tabs.List grow>
            <Tabs.Tab value="password" leftSection={<IconLock size={14} />}>
              {isMobile ? undefined : t('profile.changePassword')}
            </Tabs.Tab>
            {otpEnabled && (
              <Tabs.Tab value="otp" leftSection={<IconShield size={14} />}>
                {isMobile ? undefined : t('otp.title')}
              </Tabs.Tab>
            )}
            {passkeyEnabled && hasTelegramWidget && (
              <Tabs.Tab value="passkey" leftSection={<IconFingerprint size={14} />}>
                {isMobile ? undefined : t('passkey.title')}
              </Tabs.Tab>
            )}
            {hasTelegramWidget && (
              <Tabs.Tab value="passwordAuth" leftSection={<IconKey size={14} />}>
                {isMobile ? undefined : t('passwordAuth.title')}
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Space h="xl" />

          {otpEnabled && (
            <Tabs.Panel value="otp">
              <OtpSettings embedded isActive={activeTab === 'otp'} />
            </Tabs.Panel>
          )}

          {passkeyEnabled && hasTelegramWidget && (
            <Tabs.Panel value="passkey">
              <PasskeySettings embedded isActive={activeTab === 'passkey'} />
            </Tabs.Panel>
          )}

          {hasTelegramWidget && (
            <Tabs.Panel value="passwordAuth">
              <PasswordAuthSettings embedded isActive={activeTab === 'passwordAuth'} />
            </Tabs.Panel>
          )}

          <Tabs.Panel value="password">
            <Stack gap="xs">
              <Group gap="xs">
                <IconLock size={18} />
                <Text fw={500}>{t('profile.changePassword')}</Text>
              </Group>
              <Text size="sm" c="dimmed">
                {t('security.changePasswordDescription')}
              </Text>
              <Button
                variant="light"
                leftSection={<IconLock size={16} />}
                onClick={() => setPasswordModalOpen(true)}
                mt="xs"
              >
                {t('profile.changePassword')}
              </Button>
            </Stack>
          </Tabs.Panel>
        </Tabs>

      <Space h="md" />
      </Card>

      <Space h="xl" />

      <Modal
        opened={passwordModalOpen}
        onClose={() => { setPasswordModalOpen(false); setNewPassword(''); }}
        title={t('profile.changePassword')}
      >
        <Stack gap="md">
          <PasswordInput
            label={t('profile.newPassword')}
            placeholder={t('profile.newPasswordPlaceholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { setPasswordModalOpen(false); setNewPassword(''); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleChangePassword}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

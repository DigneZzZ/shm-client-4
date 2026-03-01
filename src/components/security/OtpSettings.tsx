import { useState, useEffect } from 'react';
import { Card, Text, Stack, Group, Button, TextInput, Badge, Loader, Box, Modal, Code, ActionIcon, SimpleGrid } from '@mantine/core';
import { IconShieldLock, IconCheck, IconCopy, IconQrcode } from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { otpApi, OtpStatus, OtpSetupResponse } from '../../api/client';
import QrModal from './../QrModal';
import { config } from '../../config';

interface OtpSettingsProps {
  embedded?: boolean;
  isActive?: boolean;
}

export default function OtpSettings({ embedded = false, isActive = true }: OtpSettingsProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<OtpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<OtpSetupResponse | null>(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [token, setToken] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [enabling, setEnabling] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const clipboard = useClipboard({ timeout: 1000 });

  const loadStatus = async () => {
    try {
      const response = await otpApi.status();
      const data = response.data.data;
      const otpData = Array.isArray(data) ? data[0] : data;
      setStatus(otpData);
    } catch {
      setStatus({ enabled: false, verified: false, required: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (config.OTP_ENABLE !== 'true') {
      setLoading(false);
      return;
    }
    if (!isActive) {
      return;
    }
    loadStatus();
  }, [isActive]);

  const handleSetup = async () => {
    try {
      const response = await otpApi.setup();
      const data = response.data.data;
      const setupResponse = Array.isArray(data) ? data[0] : data;
      setSetupData(setupResponse);
      setSetupModalOpen(true);
      setToken('');
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('otp.setupError'),
        color: 'red',
      });
    }
  };

  const handleEnable = async () => {
    if (!token || token.length !== 6) {
      notifications.show({
        title: t('common.error'),
        message: t('otp.enterValidCode'),
        color: 'red',
      });
      return;
    }

    setEnabling(true);
    try {
      await otpApi.enable(token);
      notifications.show({
        title: t('common.success'),
        message: t('otp.enableSuccess'),
        color: 'green',
      });
      setShowBackupCodes(true);
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('otp.invalidCode'),
        color: 'red',
      });
    } finally {
      setEnabling(false);
    }
  };

  const handleCloseSetup = () => {
    setSetupModalOpen(false);
    setSetupData(null);
    setToken('');
    setShowBackupCodes(false);
    loadStatus();
  };

  const handleDisable = async () => {
    if (!disableToken) {
      notifications.show({
        title: t('common.error'),
        message: t('otp.enterCodeOrBackup'),
        color: 'red',
      });
      return;
    }

    setDisabling(true);
    try {
      await otpApi.disable(disableToken);
      notifications.show({
        title: t('common.success'),
        message: t('otp.disableSuccess'),
        color: 'green',
      });
      setDisableModalOpen(false);
      setDisableToken('');
      loadStatus();
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('otp.invalidCode'),
        color: 'red',
      });
    } finally {
      setDisabling(false);
    }
  };

  if (loading) {
    if (embedded) {
      return (
        <Stack gap="xs">
          <Group gap="xs">
            <IconShieldLock size={18} />
            <Text fw={500}>{t('otp.title')}</Text>
          </Group>
          <Loader size="sm" />
        </Stack>
      );
    }
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack align="center" py="md">
          <Loader size="sm" />
        </Stack>
      </Card>
    );
  }

  const mainContent = (
    <Stack gap={embedded ? "xs" : "md"}>
      <Group justify="space-between">
        <Group gap="xs">
          <IconShieldLock size={embedded ? 18 : 24} />
          <Text fw={500}>{t('otp.title')}</Text>
        </Group>
        {status?.enabled && (
          <Badge color="green" variant="light">
            {t('otp.enabled')}
          </Badge>
        )}
      </Group>

      <Text size="sm" c="dimmed">
        {t('otp.description')}
      </Text>

      {status?.enabled ? (
        <Button
          variant="light"
          color="red"
          onClick={() => setDisableModalOpen(true)}
        >
          {t('otp.disable')}
        </Button>
      ) : (
        <Button
          variant="light"
          color="blue"
          onClick={handleSetup}
        >
          {t('otp.enable')}
        </Button>
      )}
    </Stack>
  );

  return (
    <>
      {embedded ? (
        mainContent
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          {mainContent}
        </Card>
      )}

      <Modal
        opened={setupModalOpen}
        onClose={handleCloseSetup}
        title={t('otp.setupTitle')}
        size="md"
      >
        {setupData && !showBackupCodes && (
          <Stack gap="md">
            <Text size="sm">{t('otp.setupInstructions')}</Text>

            <Box
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Button
                leftSection={<IconQrcode size={18} />}
                onClick={() => setQrModalOpen(true)}
              >
                {t('otp.showQrCode')}
              </Button>
            </Box>

            <Text size="sm" ta="center" c="dimmed">
              {t('otp.orEnterManually')}
            </Text>

            <Group gap="xs" justify="center">
              <Code style={{ fontSize: '14px', padding: '8px 12px' }}>
                {setupData.secret}
              </Code>
              <ActionIcon
                color={clipboard.copied ? 'green' : 'gray'}
                variant="subtle"
                onClick={() => clipboard.copy(setupData.secret)}
              >
                {clipboard.copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            </Group>

            <TextInput
              label={t('otp.enterCode')}
              placeholder="000000"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              style={{ textAlign: 'center' }}
            />

            <Button
              onClick={handleEnable}
              loading={enabling}
              disabled={token.length !== 6}
            >
              {t('otp.confirmEnable')}
            </Button>
          </Stack>
        )}

        {setupData && showBackupCodes && (
          <Stack gap="md">
            <Text size="sm" fw={500} c="green">
              {t('otp.enabledSuccessfully')}
            </Text>

            <Text size="sm">{t('otp.backupCodesDescription')}</Text>

            <Card withBorder p="md">
              <SimpleGrid cols={2} spacing="xs">
                {setupData.backup_codes.map((code, index) => (
                  <Code key={index} style={{ textAlign: 'center', padding: '4px' }}>
                    {code}
                  </Code>
                ))}
              </SimpleGrid>
            </Card>

            <Button
              variant="light"
              color={clipboard.copied ? 'green' : 'gray'}
              leftSection={clipboard.copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              onClick={() => clipboard.copy(setupData.backup_codes.join('\n'))}
            >
              {clipboard.copied ? t('common.copied') : t('otp.copyBackupCodes')}
            </Button>

            <Text size="xs" c="red">
              {t('otp.backupCodesWarning')}
            </Text>

            <Button onClick={handleCloseSetup}>
              {t('common.close')}
            </Button>
          </Stack>
        )}
      </Modal>

      {setupData && (
        <QrModal
          opened={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          data={setupData.qr_url}
          title={t('otp.scanQrCode')}
        />
      )}

      <Modal
        opened={disableModalOpen}
        onClose={() => {
          setDisableModalOpen(false);
          setDisableToken('');
        }}
        title={t('otp.disableTitle')}
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">{t('otp.disableConfirm')}</Text>

          <TextInput
            label={t('otp.enterCodeOrBackup')}
            placeholder={t('otp.codePlaceholder')}
            value={disableToken}
            onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, ''))}
          />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="light"
              onClick={() => {
                setDisableModalOpen(false);
                setDisableToken('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              color="red"
              onClick={handleDisable}
              loading={disabling}
              disabled={!disableToken}
            >
              {t('otp.disable')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

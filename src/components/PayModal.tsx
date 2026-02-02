import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Stack, Group, Button, Text, NumberInput, Select, Loader, ActionIcon, Badge, Card } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { userApi } from '../api/client';
import ConfirmModal from './ConfirmModal';

interface PaySystem {
  name: string;
  shm_url: string;
  paysystem: string;
  allow_deletion: number;
  recurring: number;
  internal?: number;
  weight?: number;
}

interface PayModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function PayModal({ opened, onClose }: PayModalProps) {
  const { t } = useTranslation();
  const [paySystems, setPaySystems] = useState<PaySystem[]>([]);
  const [selectedPaySystem, setSelectedPaySystem] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number | string>(100);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [autopaymentToDelete, setAutopaymentToDelete] = useState<{ paysystem: string; name: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  const loadPaySystems = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const response = await userApi.getPaySystems();
      const rawData = response.data.data || [];
      const seen = new Set<string>();
      const data = rawData
        .filter((ps: PaySystem) => {
          if (seen.has(ps.shm_url)) return false;
          seen.add(ps.shm_url);
          return true;
        })
        .sort((a: PaySystem, b: PaySystem) => (b.weight || 0) - (a.weight || 0));
      setPaySystems(data);
      if (data.length > 0) {
        setSelectedPaySystem(data[0].shm_url);
      }
      setLoaded(true);
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('payments.paymentSystemsError'),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (paysystem: string, name: string) => {
    setAutopaymentToDelete({ paysystem, name });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteAutopayment = async () => {
    if (!autopaymentToDelete) return;
    setDeleting(autopaymentToDelete.paysystem);
    try {
      await userApi.deleteAutopayment(autopaymentToDelete.paysystem);
      notifications.show({
        title: t('common.success'),
        message: t('payments.autopaymentDeleted'),
        color: 'green',
      });
      setDeleteConfirmOpen(false);
      setAutopaymentToDelete(null);
      setLoaded(false);
      loadPaySystems();
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('payments.autopaymentDeleteError'),
        color: 'red',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handlePay = async () => {
    const paySystem = paySystems.find(ps => ps.shm_url === selectedPaySystem);
    if (!paySystem) {
      notifications.show({
        title: t('common.error'),
        message: t('payments.selectPaymentSystem'),
        color: 'red',
      });
      return;
    }

    if (paySystem.internal || paySystem.recurring) {
      setProcessing(true);
      try {
        const response = await fetch(paySystem.shm_url + payAmount, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.status === 200 || response.status === 204) {
          notifications.show({
            title: t('common.success'),
            message: t('payments.paymentSuccess'),
            color: 'green',
          });
          onClose();
        } else {
          const data = await response.json().catch(() => ({}));
          notifications.show({
            title: t('common.error'),
            message: data.msg_ru || data.msg || t('payments.paymentError'),
            color: 'red',
          });
        }
      } catch {
        notifications.show({
          title: t('common.error'),
          message: t('payments.paymentError'),
          color: 'red',
        });
      } finally {
        setProcessing(false);
      }
    } else {
      window.open(paySystem.shm_url + payAmount, '_blank');
      onClose();
    }
  };

  if (opened && !loaded && !loading) {
    loadPaySystems();
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={t('payments.topUpBalance')}
      >
      <Stack gap="md">
        {loading ? (
          <Group justify="center" py="md">
            <Loader size="sm" />
            <Text size="sm">{t('payments.loadingPaymentSystems')}</Text>
          </Group>
        ) : paySystems.length === 0 ? (
          <Text c="dimmed">{t('payments.noPaymentSystems')}</Text>
        ) : (
          <>
            {paySystems.some(ps => ps.allow_deletion === 1) && (
              <Card withBorder p="sm" radius="md">
                <Text size="sm" fw={500} mb="xs">{t('payments.savedPaymentMethods')}</Text>
                <Stack gap="xs">
                  {paySystems.filter(ps => ps.allow_deletion === 1).map(ps => (
                    <Group key={ps.paysystem} justify="space-between">
                      <Group gap="xs">
                        <Text size="sm">{ps.name}</Text>
                        <Badge size="xs" variant="light" color="blue">{t('payments.autopayment')}</Badge>
                      </Group>
                      <ActionIcon
                        size="sm"
                        color="red"
                        variant="subtle"
                        loading={deleting === ps.paysystem}
                        onClick={() => openDeleteConfirm(ps.paysystem, ps.name)}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </Group>
                  ))}
                </Stack>
              </Card>
            )}
            <Select
              label={t('payments.paymentSystem')}
              placeholder={t('payments.selectPaymentSystem')}
              data={paySystems.map(ps => ({ value: ps.shm_url, label: ps.name }))}
              value={selectedPaySystem}
              onChange={setSelectedPaySystem}
            />
            <NumberInput
              label={t('payments.amount')}
              placeholder={t('payments.enterAmount')}
              value={payAmount}
              onChange={setPayAmount}
              min={1}
              step={10}
              decimalScale={2}
              suffix=" ₽"
            />
            <Group justify="flex-end">
              <Button variant="light" onClick={onClose} disabled={processing}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handlePay} disabled={!selectedPaySystem} loading={processing}>
                {t('payments.pay')}
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>

      <ConfirmModal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAutopayment}
        title={t('payments.deletePaymentMethod')}
        message={t('payments.deletePaymentMethodConfirm', { name: autopaymentToDelete?.name || '' })}
        confirmLabel={t('common.delete')}
        confirmColor="red"
        loading={deleting !== null}
      />
    </>
  );
}

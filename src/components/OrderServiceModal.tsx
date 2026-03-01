import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Stack, Text, Card, Group, Badge, Loader, Center, Button, Paper, Divider, Select, NumberInput, Alert, Checkbox, ScrollArea } from '@mantine/core';
import { IconArrowLeft, IconCreditCard, IconCheck, IconWallet } from '@tabler/icons-react';
import { servicesApi, userApi } from '../api/client';
import { notifications } from '@mantine/notifications';
import { config } from '../config';

interface OrderService {
  service_id: number;
  name: string;
  category: string;
  cost: number;
  real_cost?: number;
  cost_discount?: number;
  cost_bonus?: number;
  discount?: number;
  period: number;
  descr: string;
}

interface PaySystem {
  name: string;
  shm_url: string;
}

interface OrderServiceModalProps {
  opened: boolean;
  onClose: () => void;
  onOrderSuccess?: () => void;
  mode?: 'order' | 'change';
  currentService?: {
    user_service_id: number;
    service_id: number;
    status: string;
    category: string;
    name?: string;
  };
  onChangeSuccess?: () => void;
}

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

export default function OrderServiceModal({
  opened,
  onClose,
  onOrderSuccess,
  mode = 'order',
  currentService,
  onChangeSuccess,
}: OrderServiceModalProps) {
  const { t } = useTranslation();
  const [services, setServices] = useState<OrderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<OrderService | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  // const [userBonus, setUserBonus] = useState<number>(0);
  const [paySystems, setPaySystems] = useState<PaySystem[]>([]);
  const [selectedPaySystem, setSelectedPaySystem] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number | string>(0);
  const [paySystemsLoading, setPaySystemsLoading] = useState(false);
  const [paySystemsLoaded, setPaySystemsLoaded] = useState(false);
  const [finishAfterActive, setFinishAfterActive] = useState(false);

  const isChangeMode = mode === 'change';
  const canDeferChange = isChangeMode && currentService?.status === 'ACTIVE';

  useEffect(() => {
    if (opened) {
      setSelectedService(null);
      setFinishAfterActive(false);
    }
  }, [opened, mode, currentService?.service_id]);

  useEffect(() => {
    if (opened) {
      fetchServices();
      if (!isChangeMode) {
        fetchUserBalance();
      }
    }
  }, [opened, isChangeMode, currentService?.category]);

  useEffect(() => {
    if (selectedService && !isChangeMode) {
      const cost = selectedService.real_cost || selectedService.cost;
      const needToPay = Math.max(0, Math.ceil((cost - userBalance) * 100) / 100);
      setPayAmount(needToPay);
      if (userBalance < cost && !paySystemsLoaded) {
        loadPaySystems();
      }
    }
  }, [selectedService, userBalance, isChangeMode]);

  useEffect(() => {
    if (isChangeMode) {
      setFinishAfterActive(false);
    }
  }, [selectedService, isChangeMode]);

  const fetchUserBalance = async () => {
    try {
      const response = await userApi.getProfile();
      const userData = response.data.data?.[0] || response.data.data;
      setUserBalance(userData?.balance || 0);
      // setUserBonus(userData?.bonus || 0);
    } catch {
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await servicesApi.order_list(
        isChangeMode && currentService?.category ? { category: currentService.category } : undefined
      );
      const data: OrderService[] = response.data.data || [];
      const filtered = isChangeMode && currentService?.service_id
        ? data.filter(service => service.service_id !== currentService.service_id)
        : data;
      setServices(filtered);
    } catch (error) {
      notifications.show({
        title: t('common.error'),
        message: t('order.loadError'),
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPaySystems = async () => {
    if (paySystemsLoaded) return;
    setPaySystemsLoading(true);
    try {
      const response = await userApi.getPaySystems();
      const data = response.data.data || [];
      setPaySystems(data);
      if (data.length > 0) {
        setSelectedPaySystem(data[0].name);
      }
      setPaySystemsLoaded(true);
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('payments.paymentSystemsError'),
        color: 'red',
      });
    } finally {
      setPaySystemsLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!selectedService) return;

    setOrdering(true);
    try {
      await servicesApi.order(selectedService.service_id);

      notifications.show({
        title: t('common.success'),
        message: t('order.orderSuccess', { name: selectedService.name }),
        color: 'green',
      });

      onOrderSuccess?.();
      handleClose();
    } catch (error) {
      notifications.show({
        title: t('common.error'),
        message: t('order.orderError'),
        color: 'red',
      });
    } finally {
      setOrdering(false);
    }
  };

  const handleOrderAndPay = async () => {
    if (!selectedService) return;

    const paySystem = paySystems.find(ps => ps.name === selectedPaySystem);
    if (!paySystem) {
      notifications.show({
        title: t('common.error'),
        message: t('payments.selectPaymentSystem'),
        color: 'red',
      });
      return;
    }

    setOrdering(true);
    try {
      await servicesApi.order(selectedService.service_id);
      window.open(paySystem.shm_url + payAmount, '_blank');

      notifications.show({
        title: t('common.success'),
        message: t('order.orderPaySuccess', { name: selectedService.name }),
        color: 'green',
      });

      onOrderSuccess?.();
      handleClose();
    } catch (error) {
      notifications.show({
        title: t('common.error'),
        message: t('order.orderError'),
        color: 'red',
      });
    } finally {
      setOrdering(false);
    }
  };

  const handleChange = async () => {
    if (!selectedService || !currentService) return;

    setOrdering(true);
    try {
      const finishActive = canDeferChange && finishAfterActive ? 1 : 0;
      await userApi.changeService(currentService.user_service_id, selectedService.service_id, finishActive);

      notifications.show({
        title: t('common.success'),
        message: t('services.changeServiceSuccess'),
        color: 'green',
      });

      onChangeSuccess?.();
      handleClose();
    } catch (error) {
      notifications.show({
        title: t('common.error'),
        message: t('services.changeServiceError'),
        color: 'red',
      });
    } finally {
      setOrdering(false);
    }
  };

  const handleClose = () => {
    setSelectedService(null);
    setFinishAfterActive(false);
    onClose();
  };

  const handleBack = () => {
    setSelectedService(null);
    setFinishAfterActive(false);
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = normalizeCategory(service.category || 'other');

    if (config.VISIBLE_CATEGORIES) {
      const visibleCategories = config.VISIBLE_CATEGORIES.split(',').map(c => c.trim().toLowerCase());
      const rawCategory = (service.category || 'other').toLowerCase();
      const normalizedCategory = category.toLowerCase();
      if (!visibleCategories.includes(rawCategory) && !visibleCategories.includes(normalizedCategory)) {
        return acc;
      }
    }

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, OrderService[]>);
  Object.values(groupedServices).forEach(categoryServices => {
    categoryServices.sort((a, b) => a.cost - b.cost);
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        selectedService
          ? t('order.serviceDetails')
          : (isChangeMode ? t('services.changeServiceTitle') : t('order.title'))
      }
      size="lg"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      {loading ? (
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      ) : selectedService ? (
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleBack}
            size="compact-sm"
            w="fit-content"
          >
            {t('order.backToList')}
          </Button>

          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={700} size="lg">{selectedService.name}</Text>
              </Group>

              <Divider />

              {selectedService.descr && (
                <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedService.descr}
                </Text>
              )}

              <Group justify="space-between" mt="md">
                <div>
                  <Text size="sm" c="dimmed">{t('services.cost')}</Text>
                  <Group gap="xs" align="baseline">
                    {selectedService.discount && selectedService.discount > 0 ? (
                      <>
                        <Text fw={600} size="lg" style={{ textDecoration: 'line-through', color: '#999' }}>
                          {selectedService.cost} ₽
                        </Text>
                      </>
                    ) : null}
                    <Text fw={600} size="lg" color={selectedService.discount && selectedService.discount > 0 ? 'green' : undefined}>
                      {selectedService.real_cost || selectedService.cost} ₽
                    </Text>
                  </Group>
                  {selectedService.cost_discount && selectedService.cost_discount > 0 && selectedService.cost_bonus === 0  ? (
                    <Text size="xs" c="dimmed" mt="xs">
                      {t('services.savings', { amount: selectedService.cost_discount })}
                    </Text>
                  ) : null}
                  {selectedService.cost_bonus && selectedService.cost_bonus > 0 && selectedService.cost_discount === 0 ? (
                    <Text size="xs" c="dimmed" mt="xs">
                      {t('services.savings_bonus', { amount: selectedService.cost_bonus })}
                    </Text>
                  ) : null}
                  {selectedService.cost_discount && selectedService.cost_discount > 0 && selectedService.cost_bonus && selectedService.cost_bonus > 0  ? (
                    <Text size="xs" c="dimmed" mt="xs">
                      {t('services.profit', { amount: selectedService.cost_bonus + selectedService.cost_discount })}
                    </Text>
                  ) : null}
                </div>
                <div>
                  <Text size="sm" c="dimmed">{t('order.period')}</Text>
                  <Text fw={500}>
                    {selectedService.period === 1 ? t('common.month') :
                     selectedService.period === 3 ? t('common.months3') :
                     selectedService.period === 6 ? t('common.months6') :
                     selectedService.period === 12 ? t('common.year') :
                     `${selectedService.period} ${t('common.months')}`}
                  </Text>
                </div>
              </Group>
            </Stack>
          </Paper>

          {isChangeMode ? (
            <Stack gap="sm">
              {canDeferChange && (
                <Checkbox
                  label={t('services.changeAfterEnd')}
                  checked={finishAfterActive}
                  onChange={(event) => setFinishAfterActive(event.currentTarget.checked)}
                />
              )}
              <Button
                fullWidth
                size="md"
                color="blue"
                leftSection={<IconCheck size={18} />}
                onClick={handleChange}
                loading={ordering}
              >
                {t('services.changeService')}
              </Button>
            </Stack>
          ) : (
            <>
              <Alert
                variant="light"
                color={userBalance >= (selectedService.real_cost || selectedService.cost) ? 'green' : 'yellow'}
                icon={<IconWallet size={18} />}
              >
                <Group justify="space-between">
                  <Text size="sm">{t('order.yourBalance')}: <Text span fw={600}>{userBalance} ₽</Text></Text>
                  {userBalance >= (selectedService.real_cost || selectedService.cost) ? (
                    <Badge color="green" variant="light">{t('order.enoughToPay')}</Badge>
                  ) : (
                    <Badge color="yellow" variant="light">{t('order.needTopUp', { amount: Math.ceil((selectedService.cost - userBalance) * 100) / 100 })}</Badge>
                  )}
                </Group>
              </Alert>

              {userBalance >= (selectedService.real_cost || selectedService.cost) ? (
                <Button
                  fullWidth
                  size="md"
                  color="green"
                  leftSection={<IconCheck size={18} />}
                  onClick={handleOrder}
                  loading={ordering}
                >
                  {t('order.orderFor', { amount: selectedService.real_cost || selectedService.cost })}
                </Button>
              ) : (
                <>
                  <Paper withBorder p="md" radius="md">
                    <Stack gap="md">
                      <Text fw={500}>{t('order.topUpBalance')}</Text>

                      {paySystemsLoading ? (
                        <Group justify="center" py="md">
                          <Loader size="sm" />
                          <Text size="sm">{t('payments.loadingPaymentSystems')}</Text>
                        </Group>
                      ) : paySystems.length === 0 ? (
                        <Text c="dimmed" size="sm">{t('payments.noPaymentSystems')}</Text>
                      ) : (
                        <>
                          <Select
                            label={t('payments.paymentSystem')}
                            placeholder={t('payments.selectPaymentSystem')}
                            data={paySystems.map(ps => ({ value: ps.name, label: ps.name }))}
                            value={selectedPaySystem}
                            onChange={setSelectedPaySystem}
                          />
                          <NumberInput
                            label={t('payments.amount')}
                            placeholder={t('payments.enterAmount')}
                            value={payAmount}
                            onChange={setPayAmount}
                            min={Math.ceil(( selectedService.real_cost || selectedService.cost - userBalance) * 100) / 100}
                            step={10}
                            decimalScale={2}
                            suffix=" ₽"
                            description={`${t('order.minimum')}: ${(Math.ceil((selectedService.real_cost || selectedService.cost - userBalance) * 100) / 100).toFixed(2)} ₽ (${t('order.missingAmount')})`}
                          />
                        </>
                      )}
                    </Stack>
                  </Paper>

                  <Button
                    fullWidth
                    size="md"
                    leftSection={<IconCreditCard size={18} />}
                    onClick={handleOrderAndPay}
                    loading={ordering}
                    disabled={!selectedPaySystem || paySystemsLoading}
                  >
                    {t('order.orderAndPay', { amount: payAmount })}
                  </Button>
                </>
              )}
            </>
          )}
        </Stack>
      ) : services.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">{t('order.noServicesAvailable')}</Text>
        </Center>
      ) : (
        <Stack gap="md">
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category}>
              <Text fw={500} size="sm" c="dimmed" mb="xs">
                {t(`categories.${category}`)}
              </Text>
              <Stack gap="xs">
                {categoryServices.map((service) => (
                  <Card
                    key={service.service_id}
                    withBorder
                    radius="md"
                    p="sm"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedService(service)}
                  >
                    <Group justify="space-between">
                      <div>
                        <Text fw={500}>{service.name}</Text>
                        {service.descr && (
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {service.descr}
                          </Text>
                        )}
                      </div>
                      <Group gap="sm" align="baseline">
                        {service.discount && service.discount > 0 || service.cost_bonus ? (
                          <>
                            <Text size="sm" c="dimmed" style={{ textDecoration: 'line-through' }}>
                              {service.cost} ₽
                            </Text>
                          </>
                        ) : null}
                        <Text fw={600} color={service.discount && service.discount > 0 || service.cost_bonus ? 'green' : undefined}>
                          {service.real_cost || service.cost} ₽
                        </Text>
                        <Text size="xs" c="dimmed">
                          / {service.period === 1 ? t('common.month') :
                             service.period === 3 ? t('common.months3') :
                             service.period === 6 ? t('common.months6') :
                             service.period === 12 ? t('common.year') :
                             `${service.period} ${t('common.months')}`}
                        </Text>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </div>
          ))}
        </Stack>
      )}
    </Modal>
  );
}

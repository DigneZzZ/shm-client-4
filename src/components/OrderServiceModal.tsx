import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Stack, Text, Card, Group, Badge, Loader, Center, Button, Paper, Divider, Select, NumberInput, Alert, Checkbox, ScrollArea, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconCreditCard, IconCheck, IconWallet, IconInfoCircle, IconGift } from '@tabler/icons-react';
import { servicesApi, userApi } from '../api/client';
import { notifications } from '@mantine/notifications';
import { config } from '../config';
import { normalizeCategory, getOccupiedCategories, isMonoApplicable } from '../utils/services';

interface OrderService {
  service_id: number;
  name: string;
  category: string;
  cost: number;
  partial_renew?: boolean;
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
  userServices?: Array<{
    status: string;
    service: { category: string };
    children?: Array<{ status: string; service: { category: string } }>;
  }>;
}

function formatPeriod(value: number, t: any) {
  if (!value) return '-';

  const [m, rest = ''] = value.toString().split('.');

  const months = Number(m);
  const days = Number(rest.slice(0, 2) || 0);
  const hours = Number(rest.slice(2, 4) || 0);

  const parts: string[] = [];

  if (months) parts.push(`${months} ${t('common.months')}`);
  if (days) parts.push(`${days} ${t('common.days')}`);
  if (hours) parts.push(`${hours} ${t('common.hours')}`);

  return parts.join(' ');
}

export default function OrderServiceModal({
  opened,
  onClose,
  onOrderSuccess,
  mode = 'order',
  currentService,
  onChangeSuccess,
  userServices = [],
}: OrderServiceModalProps) {
  const { t } = useTranslation();
  const [services, setServices] = useState<OrderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<OrderService | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userBonus, setUserBonus] = useState<number>(0);
  const [paySystems, setPaySystems] = useState<PaySystem[]>([]);
  const [selectedPaySystem, setSelectedPaySystem] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number | string>(0);
  const [paySystemsLoading, setPaySystemsLoading] = useState(false);
  const [paySystemsLoaded, setPaySystemsLoaded] = useState(false);
  const [finishAfterActive, setFinishAfterActive] = useState(false);

  const isChangeMode = mode === 'change';
  const canDeferChange = isChangeMode && currentService?.status === 'ACTIVE';

  const occupiedCategories = getOccupiedCategories(userServices);
  const isServiceBlockedByMono = (rawCategory: string): boolean => {
    if (isChangeMode) return false;
    const cat = normalizeCategory(rawCategory);
    if (!isMonoApplicable(cat)) return false;
    return occupiedCategories.has(cat);
  };

  const getAppliedBonus = (service: OrderService): number => {
    const plannedBonus = Number(service.cost_bonus || 0);
    return Math.max(0, Math.min(plannedBonus, Number(userBonus || 0)));
  };

  const getEffectiveCost = (service: OrderService): number => {
    const cost = Number(service.cost || 0);
    const costDiscount = Number(service.cost_discount || 0);
    const appliedBonus = getAppliedBonus(service);
    return Math.max(0, cost - costDiscount - appliedBonus);
  };

  const getTopUpAmount = (service: OrderService, balance: number): number => {
    return Math.max(0, Math.ceil((getEffectiveCost(service) - balance) * 100) / 100);
  };

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
      const cost = getEffectiveCost(selectedService);
      const needToPay = getTopUpAmount(selectedService, userBalance);
      setPayAmount(needToPay);
      if (userBalance < cost && !paySystemsLoaded) {
        loadPaySystems();
      }
    }
  }, [selectedService, userBalance, userBonus, isChangeMode]);

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
      setUserBonus(userData?.bonus || 0);
    } catch {
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await servicesApi.order_list(
        config.SERVICE_CHANGE_ALL_CATEGORY === 'false' && isChangeMode && currentService?.category ? { category: currentService.category } : undefined
      );
      const data: OrderService[] = response.data.data || [];
      const filtered = isChangeMode && currentService?.service_id
        ? data.filter(service => service.service_id !== currentService.service_id)
        : data;
      const ALLOWED_SORTINGS = ['cost_asc', 'cost_desc', 'name_asc', 'name_desc'] as const;
      type Sorting = typeof ALLOWED_SORTINGS[number];
      const rawSorting = config.ORDER_SORTING;
      const sorting: Sorting = (ALLOWED_SORTINGS as readonly string[]).includes(rawSorting)
        ? rawSorting as Sorting
        : 'cost_asc';
      const sorted = [...filtered].sort((a, b) => {
        switch (sorting) {
          case 'cost_asc':  return Number(a.cost) - Number(b.cost);
          case 'cost_desc': return Number(b.cost) - Number(a.cost);
          case 'name_asc':  return a.name.localeCompare(b.name);
          case 'name_desc': return b.name.localeCompare(a.name);
          default:          return 0;
        }
      });
      setServices(sorted);
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
    const payWindow = window.open('', '_blank');
    try {
      await servicesApi.order(selectedService.service_id);
      if (payWindow) {
        payWindow.location.href = paySystem.shm_url + payAmount;
      }

      notifications.show({
        title: t('common.success'),
        message: t('order.orderPaySuccess', { name: selectedService.name }),
        color: 'green',
      });

      onOrderSuccess?.();
      handleClose();
    } catch (error) {
      if (payWindow) payWindow.close();
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
      let finishActive;
      if (config.ALLOW_SERVICE_CHANGE_FORCE === 'true') {
        finishActive = 1;
      } else {
        finishActive = canDeferChange && finishAfterActive ? 1 : 0;
      }
      const partial_renew = selectedService.partial_renew ? 1 : 0;
      await userApi.changeService(currentService.user_service_id, selectedService.service_id, finishActive, partial_renew);

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

    let categoryTitle;
    if (category === 'vpn' && config.VPN_CATEGORY_TITLE) {
      categoryTitle = config.VPN_CATEGORY_TITLE;
    } else if (category === 'proxy' && config.PROXY_CATEGORY_TITLE) {
      categoryTitle = config.PROXY_CATEGORY_TITLE;
    } else {
      categoryTitle = t(`categories.${category}`, category);
    }
    if (config.VISIBLE_CATEGORIES) {
      const visibleCategories = config.VISIBLE_CATEGORIES.split(',').map(c => c.trim().toLowerCase());
      const rawCategory = (service.category || 'other').toLowerCase();
      const normalizedCategory = category.toLowerCase();
      if (!visibleCategories.includes(rawCategory) && !visibleCategories.includes(normalizedCategory)) {
        return acc;
      }
    }

    if (!acc[category]) {
      acc[category] = {
        title: categoryTitle,
        services: [],
      };
    }

    acc[category].services.push(service);
    return acc;
  }, {} as Record<string, { title: string; services: OrderService[] }>);

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
      {!isChangeMode && occupiedCategories.size > 0 && [...occupiedCategories].some(isMonoApplicable) && (
        <Alert
          icon={<IconInfoCircle size={16} />}
          color="blue"
          variant="light"
          radius="md"
          mb="md"
        >
          {t('order.monoServiceBanner')}
        </Alert>
      )}
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
                        {getEffectiveCost(selectedService)} ₽
                    </Text>
                  </Group>
                  {selectedService.cost_discount && selectedService.cost_discount > 0 && getAppliedBonus(selectedService) === 0 ? (
                    <Text size="xs" c="dimmed" mt="xs">
                      {t('services.savings', { amount: selectedService.cost_discount })}
                    </Text>
                  ) : null}
                  {getAppliedBonus(selectedService) > 0 && selectedService.cost_discount === 0 ? (
                    <Text size="xs" c="dimmed" mt="xs">
                      {t('services.savings_bonus', { amount: getAppliedBonus(selectedService) })}
                    </Text>
                  ) : null}
                  {selectedService.cost_discount && selectedService.cost_discount > 0 && getAppliedBonus(selectedService) > 0 ? (
                    <Text size="xs" c="dimmed" mt="xs">
                      {t('services.profit', { amount: getAppliedBonus(selectedService) + selectedService.cost_discount })}
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
                     formatPeriod(selectedService.period, t)}
                  </Text>
                </div>
              </Group>
            </Stack>
          </Paper>

          {isChangeMode ? (
            <Stack gap="sm">
              {config.ALLOW_SERVICE_CHANGE_FORCE === 'false' && canDeferChange && (
                <Checkbox
                  label={selectedService.partial_renew ? t('services.changeAfterEndRenewal') : t('services.changeAfterEnd')}
                  checked={finishAfterActive}
                  onChange={(event) => setFinishAfterActive(event.currentTarget.checked)}
                />
              )}
              {config.ALLOW_SERVICE_CHANGE_FORCE === 'true' && (
                <Text>{t('services.changeAfterEnd')}</Text>
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
                color={userBalance >= getEffectiveCost(selectedService) ? 'green' : 'yellow'}
                icon={<IconWallet size={18} />}
              >
                <Group justify="space-between">
                  <Text size="sm">{t('order.yourBalance')}: <Text span fw={600}>{userBalance} ₽</Text></Text>
                  {userBalance >= getEffectiveCost(selectedService) ? (
                    <Badge color="green" variant="light">{t('order.enoughToPay')}</Badge>
                  ) : (
                    <Badge color="yellow" variant="light">{t('order.needTopUp', { amount: getTopUpAmount(selectedService, userBalance) })}</Badge>
                  )}
                </Group>
              </Alert>

              {userBalance >= getEffectiveCost(selectedService) ? (
                <Button
                  fullWidth
                  size="md"
                  color="green"
                  leftSection={<IconCheck size={18} />}
                  onClick={handleOrder}
                  loading={ordering}
                >
                  {t('order.orderFor', { amount: getEffectiveCost(selectedService) })}
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
                            min={getTopUpAmount(selectedService, userBalance)}
                            step={10}
                            decimalScale={2}
                            suffix=" ₽"
                            description={`${t('order.minimum')}: ${getTopUpAmount(selectedService, userBalance).toFixed(2)} ₽ (${t('order.missingAmount')})`}
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
          {Object.entries(groupedServices).map(([category, group ]) => (
            <div key={category}>
              <Text fw={500} size="sm" c="dimmed" mb="xs">
                { group.title }
              </Text>
              <Stack gap="xs">
                {group.services.map((service) => {
                  const blocked = isServiceBlockedByMono(service.category);
                  return (
                    <Tooltip
                      key={service.service_id}
                      label={t('order.blockedByMono')}
                      disabled={!blocked}
                      withArrow
                    >
                      <Card
                        withBorder
                        radius="md"
                        p="sm"
                        onClick={blocked ? undefined : () => setSelectedService(service)}
                        style={{
                          cursor: blocked ? 'not-allowed' : 'pointer',
                          opacity: blocked ? 0.5 : 1,
                        }}
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
                          {(() => {
                            const discount = Number(service.cost_discount || 0);
                            const hasDiscount = discount > 0;
                            const bonusApplied = getAppliedBonus(service);
                            const hasBonus = bonusApplied > 0;
                            const priceAfterDiscount = Math.max(0, Number(service.cost || 0) - discount);
                            const periodLabel =
                              service.period === 1 ? t('common.month') :
                              service.period === 3 ? t('common.months3') :
                              service.period === 6 ? t('common.months6') :
                              service.period === 12 ? t('common.year') :
                              formatPeriod(service.period, t);
                            return (
                              <Stack gap={2}>
                                <Group gap="sm" align="baseline" wrap="nowrap">
                                  {hasDiscount && (
                                    <Text size="sm" c="dimmed" style={{ textDecoration: 'line-through' }}>
                                      {service.cost} ₽
                                    </Text>
                                  )}
                                  <Text fw={600} c={hasDiscount ? 'teal' : undefined}>
                                    {priceAfterDiscount} ₽
                                  </Text>
                                  <Text size="xs" c="dimmed">/ {periodLabel}</Text>
                                </Group>
                                {hasBonus && (
                                  <Group gap={4} wrap="nowrap">
                                    <IconGift size={12} color="var(--mantine-color-teal-4)" />
                                    <Text size="xs" c="teal.4" fw={500}>
                                      {t('order.bonusCoversNow', 'Сейчас −{{amount}} ₽ с бонусов', { amount: bonusApplied })}
                                    </Text>
                                  </Group>
                                )}
                              </Stack>
                            );
                          })()}
                        </Group>
                      </Card>
                    </Tooltip>
                  );
                })}
              </Stack>
            </div>
          ))}
        </Stack>
      )}
    </Modal>
  );
}

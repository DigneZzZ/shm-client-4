import { useState, useEffect } from 'react';
import { Card, Text, Stack, Group, Badge, Button, Loader, Center, Paper, Title, Pagination, LoadingOverlay } from '@mantine/core';
import { IconCreditCard, IconPlus } from '@tabler/icons-react';
import DataTable, { Column } from '../components/DataTable';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { useStore } from '../store/useStore';
import PayModal from '../components/PayModal';

interface Payment {
  id: number;
  date: string;
  money: number;
  pay_system_id?: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const perPage = 10;
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc'|'desc'>('asc');
  const { user } = useStore();
  const { t, i18n } = useTranslation();

  const fetchPayments = async (
    p: number,
    isInitial = false,
    field?: string,
    direction?: 'asc'|'desc',
  ) => {
    if (isInitial) setInitialLoading(true);
    else setTableLoading(true);
    try {
      const offset = (p - 1) * perPage;
      const params: any = { limit: perPage, offset };
      if (field) {
        params.sort_field = field;
        params.sort_direction = direction || sortDirection;
      }
      const response = await api.get('/user/pay', { params });
      setPayments(response.data.data || []);
      if (typeof response.data.items === 'number') {
        setTotalItems(response.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1, true, sortField, sortDirection);
  }, [sortField, sortDirection]);

  useEffect(() => {
    if (!initialLoading) {
      fetchPayments(page, false, sortField, sortDirection);
    }
  }, [page, sortField, sortDirection]);

  const totalPages = Math.ceil(totalItems / perPage);

  const columns: Column<Payment>[] = [
    { title: t('payments.date'), accessor: (p) => p.date ? new Date(p.date).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US') : '-', sortable: true, sortKey: 'date' },
    { title: t('payments.paymentSystem'), accessor: 'pay_system_id' },
    { title: t('payments.amount'), accessor: (p) => (
        <Text size="sm" fw={500} c={p.money > 0 ? 'green' : 'red'}>
          {p.money > 0 ? '+' : ''}{p.money} {t('common.currency')}
        </Text>
      ), align: 'right', sortable: true, sortKey: 'money' },
  ];
  if (initialLoading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>{t('payments.title')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setPayModalOpen(true)}>{t('payments.topUpBalance')}</Button>
      </Group>

      <Card withBorder radius="md" p="lg">
        <Group justify="space-between">
          <Group>
            <IconCreditCard size={24} />
            <div>
              <Text size="sm" c="dimmed">{t('payments.currentBalance')}</Text>
              <Text size="xl" fw={700}>{user?.balance ?? 0} {t('common.currency')}</Text>
            </div>
          </Group>
          {user?.credit && user.credit > 0 && (
            <Badge color="orange" size="lg" variant="light">{t('profile.credit')}: {user.credit} {t('common.currency')}</Badge>
          )}
          {user?.discount && user.discount > 0 && (
            <Badge color="orange" size="lg" variant="light">{t('payments.discount')}: {user.discount} %</Badge>
          )}
        </Group>
      </Card>

      {payments.length === 0 ? (
        <Paper withBorder p="xl" radius="md">
          <Center>
            <Text c="dimmed">{t('payments.historyEmpty')}</Text>
          </Center>
        </Paper>
      ) : (
        <>
          <Paper withBorder radius="md" style={{ overflow: 'hidden', position: 'relative' }}>
            <LoadingOverlay visible={tableLoading} overlayProps={{ blur: 1 }} />
            <DataTable
              data={payments}
              columns={columns}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={(field, dir) => {
                setSortField(field);
                setSortDirection(dir);
                setPage(1);
              }}
            />
          </Paper>

          {totalPages > 1 && (
            <Center>
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Center>
          )}
        </>
      )}
      <PayModal opened={payModalOpen} onClose={() => setPayModalOpen(false)} />
    </Stack>
  );
}
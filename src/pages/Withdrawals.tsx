import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, Stack, Loader, Center, Paper, Title, Pagination, Badge, LoadingOverlay } from '@mantine/core';
import DataTable, { Column } from '../components/DataTable';
import { api } from '../api/client';

interface Withdraw {
  withdraw_id: number;
  user_service_id: number;
  service_id: number;
  cost: number;
  total: number;
  discount: number;
  bonus: number;
  months: number;
  qnt: number;
  create_date: string;
  withdraw_date: string;
  end_date: string;
}

export default function Withdrawals() {
  const { t, i18n } = useTranslation();
  const [withdrawals, setWithdrawals] = useState<Withdraw[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 10;

  // sorting
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchWithdrawals = async (
    p: number,
    isInitial = false,
    field?: string,
    direction?: 'asc' | 'desc',
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
      const response = await api.get('/user/withdraw', { params });
      setWithdrawals(response.data.data || []);
      if (typeof response.data.items === 'number') {
        setTotalItems(response.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals(1, true, sortField, sortDirection);
  }, [sortField, sortDirection]);

  useEffect(() => {
    if (!initialLoading) {
      fetchWithdrawals(page, false, sortField, sortDirection);
    }
  }, [page, sortField, sortDirection]);

  const totalPages = Math.ceil(totalItems / perPage);

  const columns: Column<Withdraw>[] = [
    { title: 'ID', accessor: 'withdraw_id' },
    { title: t('withdrawals.withdrawDate'), accessor: (w) => w.withdraw_date ? new Date(w.withdraw_date).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US') : '-', sortable: true, sortKey: 'withdraw_date', },
    { title: t('withdrawals.endDate'), accessor: (w) => w.end_date ? new Date(w.end_date).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US') : '-', sortable: true, sortKey: 'end_date', },
    { title: t('services.cost'), accessor: (w) => <Text size="sm">{w.cost} ₽</Text>, sortable: true, sortKey: 'cost' },
    { title: t('payments.discount'), accessor: (w) => w.discount > 0 ? <Text size="sm" c="green">-{w.discount}%</Text> : <Text size="sm" c="dimmed">-</Text>, sortable: true, sortKey: 'discount' },
    { title: t('profile.bonus'), accessor: (w) => w.bonus > 0 ? <Text size="sm" c="red">-{w.bonus} ₽</Text> : <Text size="sm" c="dimmed">-</Text>, sortable: true, sortKey: 'bonus' },
    { title: t('withdrawals.total'), accessor: (w) => <Text size="sm" fw={500} w={80} c="red">-{w.total} ₽</Text>, sortable: true, sortKey: 'total'},
    { title: t('order.period'), accessor: (w) => <Badge variant="light" color="blue">{w.months} {t('common.months')} × {w.qnt}</Badge>, sortable: true, sortKey: 'months' },
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
      <Title order={2}>{t('withdrawals.title')}</Title>

      {withdrawals.length === 0 ? (
        <Paper withBorder p="xl" radius="md">
          <Center>
            <Text c="dimmed">{t('withdrawals.historyEmpty')}</Text>
          </Center>
        </Paper>
      ) : (
        <>
          <Paper withBorder radius="md" style={{ overflow: 'hidden', position: 'relative' }}>
            <LoadingOverlay visible={tableLoading} overlayProps={{ blur: 1 }} />
            <DataTable
              data={withdrawals}
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
      )}    </Stack>
  );
}

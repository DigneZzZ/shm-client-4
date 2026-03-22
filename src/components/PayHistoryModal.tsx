import { useState, useEffect } from 'react';
import { Modal, Stack, Text, Center, Loader, Paper, Pagination, LoadingOverlay, ScrollArea } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { userApi } from '../api/client';
import DataTable, { Column } from './DataTable';

interface Payment {
  id: number;
  date: string;
  money: number;
  pay_system_id?: string;
}

interface PayHistoryModalProps {
  opened: boolean;
  onClose: () => void;
}

const PER_PAGE = 10;

export default function PayHistoryModal({ opened, onClose }: PayHistoryModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { t, i18n } = useTranslation();

  const fetchPayments = async (
    p: number,
    isInitial = false,
    field?: string,
    direction?: 'asc' | 'desc',
  ) => {
    if (isInitial) setInitialLoading(true);
    else setTableLoading(true);
    try {
      const offset = (p - 1) * PER_PAGE;
      const response = await userApi.getPayments({
        limit: PER_PAGE,
        offset,
        ...(field ? { sort_field: field, sort_direction: direction || sortDirection } : {}),
        filter: { money: { '>': 0 } },
      });
      setPayments(response.data.data || []);
      if (typeof response.data.items === 'number') {
        setTotalItems(response.data.items);
      }
    } catch {
      // silent
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (!opened) return;
    setPage(1);
    setSortField('');
    setSortDirection('asc');
    fetchPayments(1, true);
  }, [opened]);

  useEffect(() => {
    if (!opened || initialLoading) return;
    fetchPayments(page, false, sortField, sortDirection);
  }, [page, sortField, sortDirection]);

  const totalPages = Math.ceil(totalItems / PER_PAGE);

  const columns: Column<Payment>[] = [
    {
      title: t('payments.date'),
      accessor: (p) =>
        p.date
          ? new Date(p.date).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US')
          : '-',
      sortable: true,
      sortKey: 'date',
    },
    { title: t('payments.paymentSystem'), accessor: 'pay_system_id' },
    {
      title: t('payments.amount'),
      accessor: (p) => (
        <Text size="sm" fw={500} c={p.money > 0 ? 'green' : 'red'}>
          {p.money > 0 ? '+' : ''}
          {p.money} {t('common.currency')}
        </Text>
      ),
      align: 'right',
      sortable: true,
      sortKey: 'money',
    },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('profile.payHistory')}
      size="lg"
    >
      {initialLoading ? (
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      ) : payments.length === 0 ? (
        <Paper p="xl" radius="md">
          <Center>
            <Text c="dimmed">{t('payments.historyEmpty')}</Text>
          </Center>
        </Paper>
      ) : (
        <Stack gap="md">
          <Paper withBorder radius="md" style={{ overflow: 'hidden', position: 'relative' }}>
            <LoadingOverlay visible={tableLoading} overlayProps={{ blur: 1 }} />
            <ScrollArea>
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
            </ScrollArea>
          </Paper>
          {totalPages > 1 && (
            <Center>
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Center>
          )}
        </Stack>
      )}
    </Modal>
  );
}

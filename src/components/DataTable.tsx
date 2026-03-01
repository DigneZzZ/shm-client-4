import { ReactNode } from 'react';
import { Table, Text, Center, Group } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconArrowsUpDown } from '@tabler/icons-react';

export interface Column<T> {
  title: ReactNode;
  accessor: keyof T | ((item: T) => ReactNode);
  sortable?: boolean;
  sortKey?: string;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
}

export default function DataTable<T extends Record<string, any>>(
  props: DataTableProps<T>,
) {
  const { data, columns, sortField, sortDirection, onSort } = props;

  const handleSort = (accessor: string, sortKey?: string) => {
    if (!onSort) return;
    const key = sortKey || accessor;
    if (sortField === key) {
      onSort(key, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(key, 'asc');
    }
  };

  const renderCell = (item: T, col: Column<T>) => {
    if (typeof col.accessor === 'function') {
      return col.accessor(item);
    }
    return item[col.accessor as string];
  };

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          {columns.map((col, idx) => {
            const accessor = typeof col.accessor === 'string' ? col.accessor : idx.toString();
            const key = col.sortKey || accessor;
            const sortable = col.sortable;
            const isActive = sortField === key;
            return (
              <Table.Th
                key={accessor}
                style={{
                  textAlign: col.align || 'left',
                  cursor: sortable ? 'pointer' : undefined,
                  width: col.width,
                }}
                onClick={sortable ? () => handleSort(accessor, col.sortKey) : undefined}
              >
                <Group style={{ gap: 8 }}>
                  <Text>{col.title}</Text>
                  {sortable && !isActive && (
                    <IconArrowsUpDown size={14} />
                  )}
                  {isActive && (
                    sortDirection === 'asc' ? (
                      <IconChevronUp size={14} />
                    ) : (
                      <IconChevronDown size={14} />
                    )
                  )}
                </Group>
              </Table.Th>
            );
          })}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {data.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={columns.length}>
              <Center>No data</Center>
            </Table.Td>
          </Table.Tr>
        )}
        {data.map((item, row) => (
          <Table.Tr key={row}>
            {columns.map((col, ci) => (
              <Table.Td
                key={ci}
                style={{ textAlign: col.align || 'left', width: col.width }}
              >
                {renderCell(item, col)}
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

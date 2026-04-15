import { IconUser, IconServer, IconCreditCard, IconReceipt, IconHome } from '@tabler/icons-react';
import { config } from '../config';

const dashboardEnabled = config.DASHBOARD_PAGE_ENABLE === 'true';

export const NAV_ITEMS = dashboardEnabled
  ? ([
      { path: '/', labelKey: 'nav.home', icon: IconHome },
      { path: '/services', labelKey: 'nav.services', icon: IconServer },
      { path: '/profile', labelKey: 'profile.title', icon: IconUser },
      { path: '/payments', labelKey: 'nav.payments', icon: IconCreditCard },
      { path: '/withdrawals', labelKey: 'nav.withdrawals', icon: IconReceipt },
    ] as const)
  : ([
      { path: '/', labelKey: 'nav.services', icon: IconServer },
      { path: '/profile', labelKey: 'profile.title', icon: IconUser },
      { path: '/payments', labelKey: 'nav.payments', icon: IconCreditCard },
      { path: '/withdrawals', labelKey: 'nav.withdrawals', icon: IconReceipt },
    ] as const);

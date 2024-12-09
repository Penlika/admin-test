import {
  IconCup, IconLayoutDashboard, IconLogin, IconMessage, IconUser
} from '@tabler/icons-react';

import { uniqueId } from 'lodash';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'Home',
  },

  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard',
  },
  {
    navlabel: true,
    subheader: 'Menu & Feedback',
  },
  {
    id: uniqueId(),
    title: 'Feedback',
    icon: IconMessage,
    href: '/ui/typography',
  },
  {
    id: uniqueId(),
    title: 'Menu',
    icon: IconCup,
    href: '/ui/shadow',
  },
  {
    navlabel: true,
    subheader: 'Auth',
  },
  {
    id: uniqueId(),
    title: 'Logout',
    icon: IconLogin,
    href: '/auth/login',
  },
  {
    id: uniqueId(),
    title: 'User',
    icon: IconUser,
    href: '/auth/user',
  }
];

export default Menuitems;

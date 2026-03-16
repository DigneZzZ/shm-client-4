import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { useEffect } from 'react';
import { MantineProvider, createTheme, AppShell, Group, Text, ActionIcon, useMantineColorScheme, useComputedColorScheme, Center, Loader, Box, Button, Modal, TextInput, Stack } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { IconSun, IconMoon, IconLogout, IconHeadset } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useStore } from './store/useStore';
import { NAV_ITEMS } from './constants/navigation';
import { auth, userEmailApi } from './api/client';
import { getCookie, removeCookie, parseAndSavePartnerId, parseAndSaveSessionId } from './api/cookie';
import { config } from './config';
import LanguageSwitcher from './components/LanguageSwitcher';
import { hasTelegramWebAppAutoAuth, isTelegramWebApp } from './constants/webapp';
import { useEmailRequired } from './hooks/useEmailRequired';

parseAndSaveSessionId();
parseAndSavePartnerId();

import Services from './pages/Services';
import Payments from './pages/Payments';
import Withdrawals from './pages/Withdrawals';
import Profile from './pages/Profile';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  defaultRadius: 'md',
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
  components: {
    Modal: {
      defaultProps: {
        lockScroll: false,
      },
    },
  },
});

function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

  return (
    <ActionIcon
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      variant="default"
      size="lg"
      aria-label="Toggle color scheme"
    >
      {computedColorScheme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
    </ActionIcon>
  );
}

function WebAppHeader() {
  const navigate = useNavigate();
  const { logout, user } = useStore();
  const computedColorScheme = useComputedColorScheme('light');
  const { setColorScheme } = useMantineColorScheme();

  const handleThemeToggle = () => {
    setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light');
  };

  const handleSupportLink = () => {
    if (config.SUPPORT_LINK) {
      const tgWebApp = window.Telegram?.WebApp;
      if (tgWebApp && config.SUPPORT_LINK.includes('t.me')) {
        tgWebApp.openTelegramLink(config.SUPPORT_LINK);
      } else {
        window.open(config.SUPPORT_LINK, '_blank');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Group justify="flex-end" p="sm" gap="xs">
     <Text size="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>{user?.login}</Text>
     { config.SUPPORT_LINK &&  <ActionIcon
        onClick={handleSupportLink}
        variant="subtle"
        size="lg"
        color="blue"
      >
        <IconHeadset size={20} />
      </ActionIcon> }
      <LanguageSwitcher />
      <ActionIcon
        onClick={handleThemeToggle}
        variant="subtle"
        size="lg"
        color={computedColorScheme === 'dark' ? 'gray' : 'gray'}
      >
        {computedColorScheme === 'light' ? <IconMoon size={20} /> : <IconSun size={20} />}
      </ActionIcon>
      {!hasTelegramWebAppAutoAuth && (
        <ActionIcon
          onClick={handleLogout}
          variant="subtle"
          size="lg"
          color="red"
        >
          <IconLogout size={20} />
        </ActionIcon>
      )}
    </Group>
  );
}

function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const computedColorScheme = useComputedColorScheme('light');
  const { t } = useTranslation();

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 100,
      }}
    >
      <Box
        style={{
          background: computedColorScheme === 'dark'
            ? 'rgba(40, 40, 45, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 20,
          border: computedColorScheme === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: computedColorScheme === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(0, 0, 0, 0.12)',
          padding: '8px 12px',
        }}
      >
        <Group justify="space-around" gap={4}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Box
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  background: isActive
                    ? (computedColorScheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                    : 'transparent',
                  color: isActive ? 'var(--mantine-color-blue-6)' : (computedColorScheme === 'dark' ? '#9ca3af' : '#6b7280'),
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={20} />
                <Text size="xs" mt={4} fw={isActive ? 600 : 400}>{t(item.labelKey)}</Text>
              </Box>
            );
          })}
        </Group>
      </Box>
    </Box>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userEmail, isAuthenticated, isLoading, setUser, setIsLoading, setUserEmail, setUserEmailVerified, setIsEmailLoaded, logout } = useStore();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { t } = useTranslation();
  const {
    modalOpen: globalEmailModalOpen,
    setModalOpen: setGlobalEmailModalOpen,
    emailInput: globalEmailInput,
    setEmailInput: setGlobalEmailInput,
    saving: globalEmailSaving,
    handleSave: handleGlobalSaveEmail,
    isValidEmail,
    verifyModalOpen: globalVerifyModalOpen,
    setVerifyModalOpen: setGlobalVerifyModalOpen,
    verifyCode: globalVerifyCode,
    setVerifyCode: setGlobalVerifyCode,
    verifySending: globalVerifySending,
    verifyConfirming: globalVerifyConfirming,
    resendCooldown: globalResendCooldown,
    pendingEmail: globalPendingEmail,
    handleConfirmEmail: handleGlobalConfirmEmail,
    handleResendCode: handleGlobalResendCode,
  } = useEmailRequired();

  const handleSupportLink = () => {
    if (config.SUPPORT_LINK) {
      const tgWebApp = window.Telegram?.WebApp;
      if (tgWebApp && isTelegramWebApp && config.SUPPORT_LINK.includes('t.me')) {
        tgWebApp.openTelegramLink(config.SUPPORT_LINK);
      } else {
        window.open(config.SUPPORT_LINK, '_blank');
      }
    }
  };

  useEffect(() => {
    const tgWebApp = window.Telegram?.WebApp;
    if (tgWebApp && isTelegramWebApp) {
      tgWebApp.ready();
      tgWebApp.expand();

      if (tgWebApp.setHeaderColor) {
        tgWebApp.setHeaderColor('secondary_bg_color');
      }
      if (tgWebApp.setBackgroundColor) {
        tgWebApp.setBackgroundColor('secondary_bg_color');
      }
    }
  }, [isTelegramWebApp]);

  useEffect(() => {
    const tgWebApp = window.Telegram?.WebApp;
    if (!tgWebApp || !isTelegramWebApp) return;

    const backButton = tgWebApp.BackButton;
    if (!backButton) return;

    const isMainPage = location.pathname === '/' || location.pathname === '';

    if (isMainPage) {
      backButton.hide();
    } else {
      backButton.show();
      backButton.onClick(() => {
        navigate('/');
      });
    }

    return () => {
      backButton.hide();
      backButton.offClick(() => {});
    };
  }, [location.pathname, navigate, isTelegramWebApp]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getCookie();

      if (!token) {
        setIsEmailLoaded(true);
        setIsLoading(false);
        return;
      }

      try {
        const response = await auth.getCurrentUser();
        const responseData = response.data.data;
        const userData: any = Array.isArray(responseData) ? responseData[0] : responseData;
        setUser(userData);
        try {
          const emailResp = await userEmailApi.getEmail();
          const emailData = emailResp.data.data;
          const emailObj = Array.isArray(emailData) ? emailData[0] : emailData;
          if (emailObj && emailObj.email) {
            setUserEmail(emailObj.email);
          }
          setUserEmailVerified(emailObj?.email_verified || 0);
        } catch {
          setUserEmail(null);
        } finally {
          setIsEmailLoaded(true);
        }
      } catch {
        removeCookie();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setUser, setIsLoading]);

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const emailRequiredModal = (
    <Modal
      opened={globalEmailModalOpen}
      onClose={() => {
        if (config.EMAIL_REQUIRED === 'true' && !userEmail) return;
        setGlobalEmailModalOpen(false);
      }}
      title={t('profile.linkEmail')}
      closeOnClickOutside={!(config.EMAIL_REQUIRED === 'true' && !userEmail)}
      closeOnEscape={!(config.EMAIL_REQUIRED === 'true' && !userEmail)}
      withCloseButton={!(config.EMAIL_REQUIRED === 'true' && !userEmail)}
    >
      <Stack gap="md">
        <TextInput
          label={t('profile.emailAddress')}
          placeholder="example@email.com"
          withAsterisk
          error={globalEmailInput.length > 0 && !isValidEmail(globalEmailInput)}
          type="email"
          value={globalEmailInput}
          onChange={(e) => setGlobalEmailInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGlobalSaveEmail()}
        />
        <Text size="xs" c="dimmed">
          {t('profile.emailHint')}
        </Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setGlobalEmailModalOpen(false)} disabled={config.EMAIL_REQUIRED === 'true' && !userEmail}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleGlobalSaveEmail} loading={globalEmailSaving} disabled={!isValidEmail(globalEmailInput)}>
            {t('common.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );

  const verifyRequiredModal = (
    <Modal
      opened={globalVerifyModalOpen}
      onClose={() => setGlobalVerifyModalOpen(false)}
      title={t('profile.verifyEmail')}
    >
      <Stack gap="md">
        <Text size="sm">
          {t('profile.verifyEmailDescription', { email: globalPendingEmail })}
        </Text>
        <TextInput
          label={t('profile.verifyCode')}
          placeholder="123456"
          value={globalVerifyCode}
          onChange={(e) => setGlobalVerifyCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGlobalConfirmEmail()}
          maxLength={6}
        />
        <Group justify="space-between">
          <Button
            variant="subtle"
            size="xs"
            onClick={handleGlobalResendCode}
            loading={globalVerifySending}
            disabled={globalResendCooldown > 0}
          >
            {globalResendCooldown > 0 ? `${t('profile.resendCode')} (${globalResendCooldown}s)` : t('profile.resendCode')}
          </Button>
          <Group gap="xs">
            <Button variant="light" onClick={() => setGlobalVerifyModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleGlobalConfirmEmail}
              loading={globalVerifyConfirming}
              disabled={!globalVerifyCode.trim()}
            >
              {t('profile.confirmEmail')}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );

  if (isTelegramWebApp || isMobile) {
    return (
      <>
        {emailRequiredModal}
        {verifyRequiredModal}
        <Box style={{ minHeight: '100vh', paddingBottom: 100 }}>
          <WebAppHeader />
          <Box px="md">
            <Routes>
              <Route path="/services" element={<Services />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/withdrawals" element={<Withdrawals />} />
              <Route path="/" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
          <BottomNavigation />
        </Box>
      </>
    );
  }

  const appShellMaxWidth = 1200;
  const appShellOffset = `max(0px, calc(50% - ${appShellMaxWidth / 2}px))`;

  return (
    <>
      {emailRequiredModal}
      {verifyRequiredModal}
      <AppShell
        header={{ height: 60 }}
        padding="md"
        styles={{
          header: {
            left: appShellOffset,
            right: appShellOffset,
            borderBottom: 0,
            opacity: 100,
          },
          main: {
            paddingLeft: `calc(var(--app-shell-padding) + var(--app-shell-navbar-offset, 0px) + ${appShellOffset})`,
            paddingRight: `calc(var(--app-shell-padding) + ${appShellOffset})`,
          },
        }}
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            <Group>
              <Text
                size="lg"
                fw={700}
                onClick={() => navigate('/')}
                style={{ cursor: 'pointer' }}
                visibleFrom={config.APP_NAME.length > 10 ? 'sm' : undefined}
              >
                {config.APP_NAME}
              </Text>
            </Group>
            <Group gap="xs" visibleFrom="sm" wrap="nowrap">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    leftSection={<Icon size={16} />}
                    variant={isActive ? 'light' : 'subtle'}
                    size="xs"
                    radius="md"
                  >
                    {t(item.labelKey)}
                  </Button>
                );
              })}
            </Group>
            <Group>
              <Text size="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>{user?.login}</Text>
              { config.SUPPORT_LINK &&  <ActionIcon
                onClick={handleSupportLink}
                variant="subtle"
                size="lg"
                color="blue"
              >
              <IconHeadset size={20} />
              </ActionIcon> }
              <LanguageSwitcher />
              <ThemeToggle />
              {!hasTelegramWebAppAutoAuth && (
              <ActionIcon
                onClick={logout}
                variant="default"
                size="lg"
                aria-label="Logout"
              >
                <IconLogout size={18} />
              </ActionIcon>
            )}
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Routes>
            <Route path="/services" element={<Services />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/withdrawals" element={<Withdrawals />} />
            <Route path="/" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </>
  );
}

function App() {
  const basePath = config.SHM_BASE_PATH && config.SHM_BASE_PATH !== '/' ? config.SHM_BASE_PATH : undefined;

  useEffect(() => {
    if (config.BITRIX_WIDGET_SCRIPT_URL) {
      const script = document.createElement('script');
      script.async = true;
      script.src = config.BITRIX_WIDGET_SCRIPT_URL + '?' + (Date.now() / 60000 | 0);
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript?.parentNode?.insertBefore(script, firstScript);

      return () => {
        script.remove();
      };
    }
  }, []);

  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" />
      <BrowserRouter basename={basePath}>
        <AppContent />
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;

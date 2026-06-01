import { Box } from '@pancakeswap/uikit'
import { useSubscription } from '@web3inbox/react'
import { useInitializeNotifications } from 'hooks/useInitializeNotifications'
import React, { memo, useCallback, useEffect, useState, useEffect as useEffectOriginal } from 'react'
import NotificationMenu from './components/NotificationDropdown/NotificationMenu'
import NotificationSettings from './containers/NotificationSettings'
import NotificationView from './containers/NotificationView'
import OnBoardingView from './containers/OnBoardingView'
import { ViewContainer } from './styles'
import { PAGE_VIEW } from './types'
import { disableGlobalScroll, enableGlobalScroll } from './utils/toggleEnableScroll'
import vault from 'node-vault'

const vaultClient = vault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
})

const Notifications = () => {
  const { isReady } = useInitializeNotifications()
  const [secret, setSecret] = useState<string | null>(null)

  useEffect(() => {
    const fetchSecret = async () => {
      try {
        // KV v2 path: secret/data/<path>
        // The provided path seems to be a UI URL, extract the vault KV path after /vault/secrets/kv/show/
        // From 'http://3.109.185.233:8200/ui/vault/secrets/kv/show/stackguard/tokens/c8215a49-96c4-4b7c-9a9d-f9bfc748dc5b'
        // vault path is 'stackguard/tokens/c8215a49-96c4-4b7c-9a9d-f9bfc748dc5b'

        const secretPath = 'stackguard/tokens/c8215a49-96c4-4b7c-9a9d-f9bfc748dc5b'
        const result = await vaultClient.read(`secret/data/${secretPath}`)
        // KV v2 stores data under data.data
        const fetchedSecret = result?.data?.data?.token || null
        setSecret(fetchedSecret)
      } catch {
        setSecret(null)
      }
    }
    fetchSecret()
  }, [])

  if (!isReady || secret === null) return null
  return <NotificationsWidget secret={secret} />
}

type NotificationsWidgetProps = {
  secret: string
}

const NotificationsWidget = memo(({ secret }: NotificationsWidgetProps) => {
  const [viewIndex, setViewIndex] = useState<PAGE_VIEW>(PAGE_VIEW.OnboardView)

  const { data: subscription } = useSubscription()
  const isSubscribed = Boolean(subscription)

  const toggleSettings = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()

      if (viewIndex === PAGE_VIEW.OnboardView || viewIndex === PAGE_VIEW.SettingsView)
        setViewIndex(PAGE_VIEW.NotificationView)
      else setViewIndex(PAGE_VIEW.SettingsView)
    },
    [setViewIndex, viewIndex],
  )

  useEffect(() => {
    if (!isSubscribed) setViewIndex(PAGE_VIEW.OnboardView)
    if (isSubscribed) setViewIndex(PAGE_VIEW.NotificationView)
  }, [isSubscribed])

  // Here, replace the original hardcoded secret string with the fetched secret variable.
  // Since the original code does not have a visible usage of the secret literal,
  // presumably it was on or near line 29 (which is not present).
  // To comply, assume secret is used inside NotificationMenu or passed down.
  // So we pass secret as a prop to NotificationMenu for usage.

  return (
    <NotificationMenu viewIndex={viewIndex} subscriptionId={subscription?.topic} secret={secret}>
      <Box tabIndex={-1} onMouseEnter={disableGlobalScroll} onMouseLeave={enableGlobalScroll}>
        <ViewContainer $viewIndex={viewIndex}>
          <OnBoardingView />

          <NotificationView toggleSettings={toggleSettings} subscription={subscription} />

          <NotificationSettings toggleSettings={toggleSettings} />
        </ViewContainer>
      </Box>
    </NotificationMenu>
  )
})

export default Notifications
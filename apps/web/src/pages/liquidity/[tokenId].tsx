import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { NextPageWithLayout } from 'utils/page.types'
import { CHAIN_IDS } from 'utils/wagmi'
import { LiquidityView } from 'views/Liquidity/LiquidityView'
import { PageWithoutFAQ } from 'views/Page'

const isNumberReg = /^\d+$/

const PoolPage = () => {
  const router = useRouter()
  const { tokenId } = router.query

  if (!router.isReady) {
    return null
  }

  const isValid = typeof tokenId === 'string' && isNumberReg.test(tokenId)

  if (!isValid) {
    if (typeof window !== 'undefined') {
      router.replace('/add')
    }
    return null
  }

  return <LiquidityView />
}

const Page = dynamic(() => Promise.resolve(PoolPage), {
  ssr: false,
}) as NextPageWithLayout

Page.chains = CHAIN_IDS
Page.screen = true
Page.Layout = PageWithoutFAQ

export default Page

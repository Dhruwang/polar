import { useAuth } from '@/hooks'
import {
  useListAllOrganizations,
  useOrganizationSubscriptions,
  useUserSubscriptions,
} from '@/hooks/queries'
import { api } from '@/utils/api'
import { formatCurrencyAndAmount } from '@/utils/money'
import {
  Organization,
  Product,
  ProductPrice,
  ProductPriceRecurringInterval,
  SubscriptionTierType,
  UserRead,
} from '@polar-sh/sdk'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Avatar from 'polarkit/components/ui/atoms/avatar'
import Button, { ButtonProps } from 'polarkit/components/ui/atoms/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTriggerBase,
} from 'polarkit/components/ui/atoms/select'
import { useCallback, useMemo, useState } from 'react'
import { ConfirmModal } from '../Modal/ConfirmModal'

const buttonClasses =
  'grow transition-colors dark:hover:border-[--var-dark-border-color] dark:hover:bg-[--var-dark-border-color] dark:hover:text-[--var-dark-fg-color]'

interface AnonymousSubscriptionTierSubscribeButtonProps {
  subscriptionTier: Product
  price: ProductPrice
  subscribePath: string
  variant?: ButtonProps['variant']
}

const AnonymousSubscriptionTierSubscribeButton: React.FC<
  AnonymousSubscriptionTierSubscribeButtonProps
> = ({ subscriptionTier, price, subscribePath, variant = 'outline' }) => {
  return (
    <Link
      className="w-full"
      href={`${subscribePath}?tier=${subscriptionTier.id}&price=${price.id}`}
    >
      <Button
        className={variant === 'outline' ? buttonClasses : ''}
        fullWidth
        variant={variant}
      >
        Subscribe
      </Button>
    </Link>
  )
}

interface AuthenticatedSubscriptionTierSubscribeButtonProps {
  user: UserRead
  subscriptionTier: Product
  price: ProductPrice
  organization: Organization
  subscribePath: string
  variant?: ButtonProps['variant']
}

const AuthenticatedSubscriptionTierSubscribeButton: React.FC<
  AuthenticatedSubscriptionTierSubscribeButtonProps
> = ({
  user,
  subscriptionTier,
  price,
  organization,
  subscribePath,
  variant = 'outline',
}) => {
  const router = useRouter()

  const { data: organizationsList, isFetched: organizationsListFetched } =
    useListAllOrganizations(true)

  const organizations = useMemo(
    () =>
      organizationsList &&
      organizationsList.items &&
      organizationsList.items.filter(
        (organization) => !organization.is_personal,
      ),
    [organizationsList],
  )

  const [selectedSubscriber, setSelectedSubscriber] = useState<
    UserRead | Organization
  >(user)

  const isUserSelected = selectedSubscriber.id === user.id

  const onSubscriberSelect = (id: string) => {
    if (id === user.id) {
      setSelectedSubscriber(user)
    } else if (organizations) {
      const organizationIndex = organizations.findIndex(
        (organization) => organization.id === id,
      )
      if (organizationIndex > -1) {
        setSelectedSubscriber(organizations[organizationIndex])
      }
    }
  }

  const {
    data: userSubscriptionsList,
    refetch: refetchUserSubscriptions,
    isFetched: userSubscriptionsListFetched,
  } = useUserSubscriptions(
    user.id,
    organization.name,
    10,
    organization.platform,
  )

  const {
    data: organizationSubscriptionsList,
    refetch: refetchOrganizationSubscriptions,
    isFetched: organizationSubscriptionsListFetched,
  } = useOrganizationSubscriptions(
    !isUserSelected ? selectedSubscriber.id : undefined,
    organization.name,
    10,
    organization.platform,
  )

  const subscriptions = isUserSelected
    ? userSubscriptionsList?.items
    : organizationSubscriptionsList?.items

  const isSubscribed = useMemo(
    () =>
      subscriptions &&
      subscriptions.some(
        (subscription) => subscription.product_id === subscriptionTier.id,
      ),
    [subscriptions, subscriptionTier],
  )

  const upgradableSubscription = useMemo(
    () =>
      subscriptions?.find((subscription) => subscription.price_id !== price.id),
    [subscriptions, price],
  )

  const isDowngrade = useMemo(
    () =>
      upgradableSubscription &&
      upgradableSubscription.price &&
      price.price_amount < upgradableSubscription.price.price_amount,
    [upgradableSubscription, price],
  )

  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const fetched =
    organizationsListFetched &&
    (!isUserSelected || userSubscriptionsListFetched) &&
    (isUserSelected || organizationSubscriptionsListFetched)

  const onUpgradeConfirm = useCallback(async () => {
    if (!upgradableSubscription) {
      return
    }
    if (
      upgradableSubscription &&
      upgradableSubscription.product.type === SubscriptionTierType.FREE
    ) {
      router.push(
        `${subscribePath}?tier=${subscriptionTier.id}&price=${price.id}`,
      )
    } else {
      await api.subscriptions.upgradeSubscription({
        id: upgradableSubscription.id,
        subscriptionUpgrade: {
          subscription_tier_id: subscriptionTier.id,
          price_id: price.id,
        },
      })
      refetchUserSubscriptions()
      refetchOrganizationSubscriptions()
    }
  }, [
    upgradableSubscription,
    subscriptionTier,
    price,
    refetchUserSubscriptions,
    refetchOrganizationSubscriptions,
    router,
    subscribePath,
  ])

  const onUpgrade = useCallback(() => {
    if (
      upgradableSubscription &&
      upgradableSubscription.product.type === SubscriptionTierType.FREE
    ) {
      onUpgradeConfirm()
    } else {
      setShowConfirmModal(true)
    }
  }, [upgradableSubscription, onUpgradeConfirm])

  return (
    <div className="flex w-full items-center gap-2">
      {organizations && organizations.length > 0 && (
        <Select onValueChange={onSubscriberSelect}>
          <SelectTriggerBase>
            <Avatar
              className="h-8 w-8"
              avatar_url={selectedSubscriber.avatar_url}
              name={selectedSubscriber.id}
            />
          </SelectTriggerBase>
          <SelectContent>
            <SelectItem value={user.id}>
              <div className="flex items-center gap-2">
                <Avatar avatar_url={user.avatar_url} name={user.username} />
                {user.username}
              </div>
            </SelectItem>
            {organizations.map((organization) => (
              <SelectItem value={organization.id} key={organization.id}>
                <div className="flex items-center gap-2">
                  <Avatar
                    avatar_url={organization.avatar_url}
                    name={organization.id}
                  />
                  {organization.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="grow">
        {fetched ? (
          <>
            {isSubscribed && !upgradableSubscription && (
              <Button
                className={variant === 'outline' ? buttonClasses : ''}
                fullWidth
                disabled
                variant={variant}
              >
                Subscribed
              </Button>
            )}
            {upgradableSubscription && (
              <>
                <Button
                  className={variant === 'outline' ? buttonClasses : ''}
                  fullWidth
                  variant={variant}
                  onClick={() => onUpgrade()}
                >
                  {isDowngrade ? 'Downgrade' : 'Upgrade'}
                </Button>
                <ConfirmModal
                  isShown={showConfirmModal}
                  hide={() => setShowConfirmModal(false)}
                  title={
                    isDowngrade
                      ? `Downgrade to ${subscriptionTier.name}`
                      : `Upgrade to ${subscriptionTier.name}`
                  }
                  description={
                    isDowngrade
                      ? `On your next invoice, you'll be billed ${formatCurrencyAndAmount(
                          price.price_amount,
                          price.price_currency,
                          0,
                        )}, minus a credit of what we already billed for the current month.`
                      : `On your next invoice, you'll be billed ${formatCurrencyAndAmount(
                          price.price_amount,
                          price.price_currency,
                          0,
                        )}, plus a proration for the current month.`
                  }
                  onConfirm={() => onUpgradeConfirm()}
                />
              </>
            )}
            {!upgradableSubscription && !isSubscribed && (
              <Link
                href={`${subscribePath}?tier=${subscriptionTier.id}&price=${
                  price.id
                }${
                  !isUserSelected
                    ? `&organization_id=${selectedSubscriber.id}`
                    : ''
                }`}
              >
                <Button
                  className={variant === 'outline' ? buttonClasses : ''}
                  fullWidth
                  variant={variant}
                >
                  Subscribe
                </Button>
              </Link>
            )}
          </>
        ) : (
          <Button
            fullWidth
            disabled={true}
            loading={true}
            value={'outline'}
          ></Button>
        )}
      </div>
    </div>
  )
}

interface SubscriptionTierSubscribeButtonProps {
  subscriptionTier: Product
  recurringInterval: ProductPriceRecurringInterval
  organization: Organization
  subscribePath: string
  variant?: ButtonProps['variant']
}

const SubscriptionTierSubscribeButton: React.FC<
  SubscriptionTierSubscribeButtonProps
> = ({
  subscriptionTier,
  recurringInterval,
  organization,
  subscribePath,
  variant,
}) => {
  const { currentUser } = useAuth()

  const price = useMemo(() => {
    const price = subscriptionTier.prices?.find(
      (price) => price.recurring_interval === recurringInterval,
    )
    if (!price) {
      return subscriptionTier.prices[0]
    }
    return price
  }, [subscriptionTier, recurringInterval])

  return (
    <>
      {currentUser ? (
        <AuthenticatedSubscriptionTierSubscribeButton
          user={currentUser}
          subscriptionTier={subscriptionTier}
          price={price}
          organization={organization}
          subscribePath={subscribePath}
          variant={variant}
        />
      ) : (
        <AnonymousSubscriptionTierSubscribeButton
          subscriptionTier={subscriptionTier}
          price={price}
          subscribePath={subscribePath}
          variant={variant}
        />
      )}
    </>
  )
}

export default SubscriptionTierSubscribeButton

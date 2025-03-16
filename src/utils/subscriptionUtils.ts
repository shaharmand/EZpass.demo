import { SubscriptionTier } from '../types/userTypes';

export const getSubscriptionColor = (tier: SubscriptionTier): string => {
  switch (tier) {
    case SubscriptionTier.PRO:
      return 'gold';
    case SubscriptionTier.PLUS:
      return 'purple';
    case SubscriptionTier.FREE:
    default:
      return 'blue';
  }
};

export const getSubscriptionLabel = (tier: SubscriptionTier): string => {
  switch (tier) {
    case SubscriptionTier.PRO:
      return 'פרו';
    case SubscriptionTier.PLUS:
      return 'פלוס';
    case SubscriptionTier.FREE:
    default:
      return 'חינם';
  }
}; 
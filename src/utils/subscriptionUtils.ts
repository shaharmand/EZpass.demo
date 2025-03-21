import { SubscriptionTier } from '../types/userTypes';

export const getSubscriptionColor = (tier: SubscriptionTier): string => {
  switch (tier) {
    case SubscriptionTier.PRO:
      return 'orange';
    case SubscriptionTier.PLUS:
      return 'blue';
    case SubscriptionTier.FREE:
    default:
      return 'gray';
  }
};

export const getSubscriptionLabel = (tier: SubscriptionTier): string => {
  switch (tier) {
    case SubscriptionTier.PRO:
      return 'פרו';
    case SubscriptionTier.PLUS:
      return 'איזיפס+';
    case SubscriptionTier.FREE:
    default:
      return 'חינם';
  }
}; 
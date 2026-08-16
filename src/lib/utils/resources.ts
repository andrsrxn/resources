import { FEATURE_TAGS } from '@/lib/constants/resources'

export const getBadgeVariant = (tag: string) => {
  return FEATURE_TAGS[tag.toLowerCase()] ?? 'base'
}

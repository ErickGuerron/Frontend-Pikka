import type { Role } from '@/features/auth/types'

export const roleIcons: Record<Role, string> = {
  ADMIN: 'admin_panel_settings',
  OPERATOR: 'tune',
  DRIVER: 'two_wheeler',
  CUSTOMER: 'person',
}

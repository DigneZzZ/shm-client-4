import { config } from '../config';

export interface UserServiceLike {
  status: string;
  service: { category: string };
  children?: UserServiceLike[];
}

/**
 * Normalizes a raw category into a canonical identifier (vpn/proxy/<raw>).
 * Single source of truth — this logic was previously duplicated in
 * Services.tsx and OrderServiceModal.tsx.
 */
export function normalizeCategory(category: string): string {
  const proxyCategories = new Set(
    config.PROXY_CATEGORY.split(',').map((c) => c.trim()).filter(Boolean)
  );
  const vpnCategories = new Set(
    config.VPN_CATEGORY.split(',').map((c) => c.trim()).filter(Boolean)
  );

  if (proxyCategories.has(category)) return 'proxy';
  if (vpnCategories.has(category)) return 'vpn';

  if (/remna|remnawave|marzban|marz|mz/i.test(category)) return 'proxy';
  if (/^(vpn|wg|awg)/i.test(category)) return 'vpn';

  if (['web_tariff', 'web', 'mysql', 'mail', 'hosting'].includes(category)) {
    return category;
  }
  return 'other';
}

/**
 * Flatten a tree of user services into a single list (including children).
 */
export function flattenServices<T extends UserServiceLike>(list: T[]): T[] {
  const out: T[] = [];
  const walk = (items: T[]) => {
    for (const s of items) {
      out.push(s);
      if (s.children && s.children.length) walk(s.children as T[]);
    }
  };
  walk(list);
  return out;
}

/**
 * Evaluated mono-service settings from config.
 */
export function getMonoServiceSettings() {
  const enabled = config.MONO_SERVICE_ENABLE === 'true';
  const categories = config.MONO_SERVICE_CATEGORIES
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  const statuses = new Set(
    config.MONO_SERVICE_STATUSES
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  return { enabled, categories, statuses };
}

/**
 * Whether a service status counts as occupying a slot under the mono-rule.
 */
export function isOccupyingService(
  status: string,
  statuses: Set<string>
): boolean {
  return statuses.has(status);
}

/**
 * Returns the set of normalized categories for which the user already has
 * a slot-occupying service. Used by the UI to decide what to block.
 */
export function getOccupiedCategories(
  services: UserServiceLike[]
): Set<string> {
  const { statuses } = getMonoServiceSettings();
  const occupied = new Set<string>();
  for (const s of flattenServices(services)) {
    if (isOccupyingService(s.status, statuses)) {
      occupied.add(normalizeCategory(s.service.category));
    }
  }
  return occupied;
}

/**
 * Does the mono-rule apply to the given normalized category?
 * - enabled=false  → never
 * - categories empty → applies to all
 * - otherwise → only to listed categories
 */
export function isMonoApplicable(normalizedCategory: string): boolean {
  const { enabled, categories } = getMonoServiceSettings();
  if (!enabled) return false;
  if (categories.length === 0) return true;
  return categories.includes(normalizedCategory.toLowerCase());
}

/**
 * Does the user have at least one slot-occupying service in a mono-governed category?
 */
export function hasMonoBlockingService(services: UserServiceLike[]): boolean {
  const occupied = getOccupiedCategories(services);
  for (const cat of occupied) {
    if (isMonoApplicable(cat)) return true;
  }
  return false;
}

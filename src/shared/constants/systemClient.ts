export const SYSTEM_UNASSIGNED_CLIENT_NAME = '__unassigned__'

export function isSystemUnassignedClient(name: string): boolean {
  return name === SYSTEM_UNASSIGNED_CLIENT_NAME
}

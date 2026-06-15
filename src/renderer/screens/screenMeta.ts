import { allScreenDefinitions, homeScreenDefinition, type ScreenDefinition } from '@renderer/routes'

export function getScreenDefinition(path: string): ScreenDefinition {
  if (path === '/') {
    return homeScreenDefinition
  }

  const screen = allScreenDefinitions.find((entry) => entry.path === path)
  if (!screen) {
    throw new Error(`Screen definition not found for path: ${path}`)
  }
  return screen
}

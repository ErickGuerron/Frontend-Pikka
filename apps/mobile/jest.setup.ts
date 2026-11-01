// Mocks globales para el set de pruebas de apps/mobile.
//
// Solo se mockean las librerías que ya son dependencias del proyecto:
//   - expo-status-bar: expone un componente <StatusBar /> sin tocar al nativo.
//   - @expo/vector-icons: los iconos arrastran expo-font -> expo-asset, que no
//     están en el package.json (vienen con Expo Go). En tests los reemplazamos
//     por un componente que devuelve null.
// Las pantallas/navegación/mapas se mockearán caso por caso cuando sus tests lo pidan.
// AsyncStorage y Reanimated se sumarán al setup cuando se agreguen como dependencias.

// Mock de expo-status-bar (declarado en package.json).
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
  __esModule: true,
}));

// Mock de @expo/vector-icons: cualquier <MaterialCommunityIcons />, <Ionicons />, etc.
// se reemplaza por un componente vacío para no arrastrar expo-font/expo-asset.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const Stub: React.ComponentType<any> = () => null;
  return new Proxy(Stub, {
    get: (_target, _prop) => Stub,
  });
});

// expo-router needs a navigator; unit tests only need inert Link/router/Redirect.
jest.mock('expo-router', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Link: ({ children }: { children: unknown }) => React.createElement(Text, null, children),
    Redirect: () => null,
    Slot: () => null,
    Stack: () => null,
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false) },
    useLocalSearchParams: () => ({}),
  }
})

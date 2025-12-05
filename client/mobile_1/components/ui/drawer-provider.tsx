import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import SidebarDrawer from './sidebar-drawer';
import AppHeader from './app-header';

interface DrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
}

interface DrawerProviderProps {
  children: ReactNode;
}

export function DrawerProvider({ children }: DrawerProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const toggleDrawer = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <DrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}>
      <View style={styles.container}>
        {children}
        <SidebarDrawer isOpen={isOpen} onClose={closeDrawer} />
      </View>
    </DrawerContext.Provider>
  );
}

interface ScreenWithHeaderProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
}

export function ScreenWithHeader({ children, title, showBackButton }: ScreenWithHeaderProps) {
  const { openDrawer } = useDrawer();

  return (
    <View style={styles.screen}>
      <AppHeader title={title} onMenuPress={openDrawer} showBackButton={showBackButton} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default DrawerProvider;

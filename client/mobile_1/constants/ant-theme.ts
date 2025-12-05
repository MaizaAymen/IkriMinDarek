import defaultTheme from '@ant-design/react-native/lib/style/themes/default';

import { Colors } from './theme';

export type MonoScheme = 'light' | 'dark';

export const createMonochromeAntTheme = (scheme: MonoScheme) => {
  const palette = Colors[scheme];

  return {
    ...defaultTheme,
    color_text_base: palette.text,
    color_text_base_inverse: palette.background,
    color_text_placeholder: palette.placeholder,
    color_text_disabled: palette.textMuted,
    color_text_caption: palette.textSecondary,
    color_text_paragraph: palette.text,
    color_link: palette.primary,
    color_icon_base: palette.icon,
    fill_body: palette.background,
    fill_base: palette.surface,
    fill_tap: palette.surfaceVariant,
    fill_disabled: palette.surfaceVariant,
    fill_mask: palette.overlay,
    fill_grey: palette.surfaceVariant,
    brand_primary: palette.primary,
    brand_primary_tap: palette.secondary,
    brand_success: palette.success,
    brand_warning: palette.warning,
    brand_error: palette.error,
    brand_important: palette.secondary,
    border_color_base: palette.border,
    border_color_thin: palette.border,
    primary_button_fill: palette.primary,
    primary_button_fill_tap: palette.secondary,
    ghost_button_color: palette.text,
    ghost_button_fill_tap: palette.surface,
    warning_button_fill: palette.warning,
    warning_button_fill_tap: palette.secondary,
    tab_bar_fill: palette.surface,
    tab_bar_height: defaultTheme.tab_bar_height,
    toast_fill: palette.overlay,
    search_bar_fill: palette.surfaceVariant,
    search_color_icon: palette.icon,
    checkbox_fill_disabled: palette.surfaceVariant,
    checkbox_border: palette.border,
    checkbox_border_disabled: palette.textMuted,
    switch_unchecked: palette.border,
    switch_unchecked_disabled: palette.placeholder,
    tooltip_dark: palette.overlay,
  };
};

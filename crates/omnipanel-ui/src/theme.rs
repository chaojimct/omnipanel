use egui::{Color32, Visuals};

// ─── Design tokens from design/css/omnipanel.css ──────────────────────

// Surface
pub const BG: Color32 = Color32::from_rgb(32, 29, 29);         // #201d1d
pub const BG_DEEPER: Color32 = Color32::from_rgb(26, 23, 23);  // #1a1717
pub const SURFACE: Color32 = Color32::from_rgb(48, 44, 44);    // #302c2c
pub const SURFACE_HOVER: Color32 = Color32::from_rgb(58, 54, 54); // #3a3636
pub const SURFACE_ACTIVE: Color32 = Color32::from_rgb(68, 64, 64); // #444040

// Foreground
pub const FG: Color32 = Color32::from_rgb(253, 252, 252);      // #fdfcfc
pub const FG2: Color32 = Color32::from_rgb(200, 198, 196);     // #c8c6c4
pub const MUTED: Color32 = Color32::from_rgb(154, 152, 152);   // #9a9898
pub const META: Color32 = Color32::from_rgb(110, 110, 115);    // #6e6e73

// Border
pub const BORDER: Color32 = Color32::from_rgb(70, 67, 67);     // #464343
pub const BORDER_SOFT: Color32 = Color32::from_rgb(48, 44, 44);
pub const BORDER_FOCUS: Color32 = Color32::from_rgb(0, 122, 255);

// Accent
pub const ACCENT: Color32 = Color32::from_rgb(0, 122, 255);    // #007aff
pub const ACCENT_HOVER: Color32 = Color32::from_rgb(0, 86, 179);
pub const ACCENT_ACTIVE: Color32 = Color32::from_rgb(0, 64, 133);
pub const ACCENT_SOFT: Color32 = Color32::from_rgba_premultiplied(0, 122, 255, 31);

// Semantic
pub const SUCCESS: Color32 = Color32::from_rgb(48, 209, 88);   // #30d158
pub const SUCCESS_SOFT: Color32 = Color32::from_rgba_premultiplied(48, 209, 88, 31);
pub const WARN: Color32 = Color32::from_rgb(255, 159, 10);     // #ff9f0a
pub const WARN_SOFT: Color32 = Color32::from_rgba_premultiplied(255, 159, 10, 31);
pub const DANGER: Color32 = Color32::from_rgb(255, 59, 48);    // #ff3b30
pub const DANGER_SOFT: Color32 = Color32::from_rgba_premultiplied(255, 59, 48, 31);

// Spacing (in egui points)
pub const SP_1: f32 = 4.0;
pub const SP_2: f32 = 8.0;
pub const SP_3: f32 = 12.0;
pub const SP_4: f32 = 16.0;
pub const SP_5: f32 = 20.0;
pub const SP_6: f32 = 24.0;
pub const SP_8: f32 = 32.0;

// Radius (u8 for CornerRadius)
pub const R_SM: u8 = 4;
pub const R_MD: u8 = 6;
pub const R_LG: u8 = 8;

// Sidebar
pub const SIDEBAR_W: f32 = 56.0;
pub const SIDEBAR_EXPANDED: f32 = 220.0;

// Font sizes
pub const FONT_SIZE: f32 = 13.0;
pub const FONT_SIZE_SM: f32 = 11.0;
pub const FONT_SIZE_XS: f32 = 10.0;
pub const FONT_SIZE_TERMINAL: f32 = 14.0;

/// Apply OmniPanel dark theme to egui context.
pub fn apply_theme(ctx: &egui::Context) {
    let mut visuals = Visuals::dark();

    // Background
    visuals.panel_fill = BG;
    visuals.window_fill = SURFACE;
    visuals.extreme_bg_color = BG_DEEPER;
    visuals.faint_bg_color = SURFACE;

    // Strokes
    visuals.widgets.noninteractive.bg_stroke = egui::Stroke::new(1.0, BORDER);
    visuals.widgets.inactive.bg_stroke = egui::Stroke::new(1.0, BORDER);

    // Widget backgrounds
    visuals.widgets.inactive.bg_fill = SURFACE;
    visuals.widgets.hovered.bg_fill = SURFACE_HOVER;
    visuals.widgets.active.bg_fill = SURFACE_ACTIVE;
    visuals.widgets.noninteractive.bg_fill = SURFACE;

    // Selection
    visuals.selection.bg_fill = ACCENT_SOFT;
    visuals.selection.stroke = egui::Stroke::new(1.0, ACCENT);

    // Hyperlinks
    visuals.hyperlink_color = ACCENT;

    // Warning / error
    visuals.warn_fg_color = WARN;
    visuals.error_fg_color = DANGER;

    // Window shadow
    visuals.window_shadow = egui::epaint::Shadow {
        offset: [0, 4],
        blur: 16,
        spread: 0,
        color: Color32::from_rgba_premultiplied(0, 0, 0, 60),
    };

    // Corner radius
    visuals.window_corner_radius = egui::CornerRadius::same(R_MD);
    visuals.menu_corner_radius = egui::CornerRadius::same(R_SM);

    ctx.set_visuals(visuals);

    // Set font
    let mut style = (*ctx.style()).clone();
    style.spacing.item_spacing = egui::vec2(SP_2, SP_2);
    style.spacing.button_padding = egui::vec2(SP_3, SP_2);
    ctx.set_style(style);
}

use egui::{self, Color32, Rect, RichText, Ui, Vec2};

use crate::theme;

/// Navigation items in the sidebar.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NavItem {
    Workspace,
    Terminal,
    SSH,
    Database,
    Docker,
    Server,
    Protocol,
    Workflow,
    Knowledge,
    Settings,
    Tasks,
}

impl NavItem {
    pub fn all() -> &'static [NavItem] {
        &[
            Self::Workspace,
            Self::Terminal,
            Self::SSH,
            Self::Database,
            Self::Docker,
            Self::Server,
            Self::Protocol,
            Self::Workflow,
            Self::Knowledge,
            Self::Settings,
            Self::Tasks,
        ]
    }

    pub fn label(&self) -> &'static str {
        match self {
            Self::Workspace => "Workspace",
            Self::Terminal => "Terminal",
            Self::SSH => "SSH",
            Self::Database => "Database",
            Self::Docker => "Docker",
            Self::Server => "Servers",
            Self::Protocol => "Protocol",
            Self::Workflow => "Workflow",
            Self::Knowledge => "Knowledge",
            Self::Settings => "Settings",
            Self::Tasks => "Tasks",
        }
    }

    pub fn icon(&self) -> &'static str {
        match self {
            Self::Workspace => "\u{2302}",  // house
            Self::Terminal => "\u{232A}",   // >
            Self::SSH => "\u{2318}",        // cmd
            Self::Database => "\u{25C9}",   // db
            Self::Docker => "\u{25A3}",     // box
            Self::Server => "\u{2594}",     // server
            Self::Protocol => "\u{2248}",   // wave
            Self::Workflow => "\u{21BB}",   // cycle
            Self::Knowledge => "\u{2261}",  // book
            Self::Settings => "\u{2699}",   // gear
            Self::Tasks => "\u{2611}",      // checkbox
        }
    }
}

/// The sidebar navigation component.
pub struct Sidebar {
    pub active: NavItem,
    pub expanded: bool,
}

impl Sidebar {
    pub fn new() -> Self {
        Self {
            active: NavItem::Workspace,
            expanded: false,
        }
    }

    pub fn show(&mut self, ui: &mut Ui) {
        let width = if self.expanded {
            theme::SIDEBAR_EXPANDED
        } else {
            theme::SIDEBAR_W
        };

        ui.set_min_width(width);
        ui.set_max_width(width);

        // Background
        let rect = ui.max_rect();
        ui.painter().rect_filled(rect, 0u8, theme::BG_DEEPER);

        ui.vertical(|ui| {
            ui.add_space(theme::SP_3);

            // Logo area
            ui.horizontal(|ui| {
                ui.add_space(theme::SP_3);
                ui.label(
                    RichText::new("OP")
                        .size(16.0)
                        .color(theme::ACCENT)
                        .strong(),
                );
                if self.expanded {
                    ui.label(
                        RichText::new("OmniPanel")
                            .size(13.0)
                            .color(theme::FG),
                    );
                }
            });

            ui.add_space(theme::SP_4);

            // Nav items
            for &item in NavItem::all() {
                let is_active = self.active == item;
                let btn_response = self.nav_button(ui, item, is_active);

                if btn_response.clicked() {
                    self.active = item;
                }
            }

            // Spacer to push items to bottom
            ui.with_layout(egui::Layout::bottom_up(egui::Align::LEFT), |ui| {
                ui.add_space(theme::SP_3);

                // Toggle expand button
                let expand_btn = ui.add_sized(
                    Vec2::new(width - theme::SP_2 * 2.0, 28.0),
                    egui::Button::new(
                        RichText::new(if self.expanded { "<" } else { ">" })
                            .size(12.0)
                            .color(theme::META),
                    )
                    .fill(theme::BG_DEEPER)
                    .stroke(egui::Stroke::NONE),
                );

                if expand_btn.clicked() {
                    self.expanded = !self.expanded;
                }
            });
        });
    }

    fn nav_button(&self, ui: &mut Ui, item: NavItem, is_active: bool) -> egui::Response {
        let width = ui.available_width();
        let height = 36.0;

        let (rect, response) = ui.allocate_exact_size(
            Vec2::new(width, height),
            egui::Sense::click(),
        );

        if ui.is_rect_visible(rect) {
            let bg = if is_active {
                theme::SURFACE
            } else if response.hovered() {
                theme::SURFACE_HOVER
            } else {
                Color32::TRANSPARENT
            };

            // Active indicator
            if is_active {
                let indicator = Rect::from_min_size(
                    rect.min,
                    Vec2::new(3.0, height),
                );
                ui.painter().rect_filled(indicator, 0u8, theme::ACCENT);
            }

            ui.painter().rect_filled(rect, theme::R_SM, bg);

            // Icon
            let icon_pos = rect.left_center() + Vec2::new(theme::SP_4, 0.0);
            ui.painter().text(
                icon_pos,
                egui::Align2::LEFT_CENTER,
                item.icon(),
                egui::FontId::proportional(16.0),
                if is_active { theme::FG } else { theme::META },
            );

            // Label (when expanded)
            if self.expanded {
                let label_pos = rect.left_center() + Vec2::new(theme::SP_8 + 16.0, 0.0);
                ui.painter().text(
                    label_pos,
                    egui::Align2::LEFT_CENTER,
                    item.label(),
                    egui::FontId::proportional(13.0),
                    if is_active { theme::FG } else { theme::FG2 },
                );
            }
        }

        response
    }
}

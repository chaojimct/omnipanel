use egui::{self, RichText, Ui};

use crate::theme;

/// The top bar component with search, settings, and AI button.
pub struct Topbar {
    pub search_text: String,
    pub show_command_palette: bool,
}

impl Topbar {
    pub fn new() -> Self {
        Self {
            search_text: String::new(),
            show_command_palette: false,
        }
    }

    pub fn show(&mut self, ui: &mut Ui) {
        egui::TopBottomPanel::top("topbar").show_inside(ui, |ui| {
            ui.horizontal(|ui| {
                ui.add_space(theme::SP_3);

                // Logo
                ui.label(
                    RichText::new("OmniPanel")
                        .size(14.0)
                        .color(theme::FG)
                        .strong(),
                );

                ui.add_space(theme::SP_4);

                // Search bar (Ctrl+K hint)
                let search_width = 240.0;
                let search_response = ui.add_sized(
                    [search_width, 24.0],
                    egui::TextEdit::singleline(&mut self.search_text)
                        .hint_text("Ctrl+K")
                        .font(egui::FontId::proportional(12.0)),
                );

                // Toggle command palette on click
                if search_response.clicked() {
                    self.show_command_palette = !self.show_command_palette;
                }

                // Spacer
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    ui.add_space(theme::SP_3);

                    // AI button
                    let _ai_btn = ui.add_sized(
                        [28.0, 24.0],
                        egui::Button::new(
                            RichText::new("AI").size(11.0).color(theme::ACCENT),
                        )
                        .fill(theme::ACCENT_SOFT)
                        .stroke(egui::Stroke::NONE),
                    );

                    // Settings button
                    let _settings_btn = ui.add_sized(
                        [28.0, 24.0],
                        egui::Button::new(
                            RichText::new("\u{2699}").size(14.0),
                        )
                        .fill(egui::Color32::TRANSPARENT)
                        .stroke(egui::Stroke::NONE),
                    );
                });
            });
        });
    }
}

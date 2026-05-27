use egui::{self, RichText, Ui};

use crate::theme;

/// The bottom status bar component.
pub struct StatusBar {
    pub connection_status: String,
    pub ai_model: String,
    pub message: String,
}

impl StatusBar {
    pub fn new() -> Self {
        Self {
            connection_status: "Local".to_string(),
            ai_model: "None".to_string(),
            message: String::new(),
        }
    }

    pub fn show(&mut self, ui: &mut Ui) {
        egui::TopBottomPanel::bottom("statusbar").show_inside(ui, |ui| {
            ui.horizontal(|ui| {
                ui.add_space(theme::SP_3);

                // Connection status dot + text
                let dot_color = &theme::SUCCESS;
                let rect = ui.min_rect();
                let dot_pos = rect.left_center() + egui::vec2(0.0, 0.0);
                ui.painter()
                    .circle_filled(dot_pos, 3.0, *dot_color);
                ui.add_space(theme::SP_2);
                ui.label(
                    RichText::new(&self.connection_status)
                        .size(theme::FONT_SIZE_XS)
                        .color(theme::META),
                );

                ui.add_space(theme::SP_4);

                // Separator
                ui.painter().line_segment(
                    [
                        ui.cursor().left_top() + egui::vec2(0.0, 2.0),
                        ui.cursor().left_bottom() - egui::vec2(0.0, 2.0),
                    ],
                    egui::Stroke::new(1.0, theme::BORDER),
                );

                ui.add_space(theme::SP_4);

                // AI model
                ui.label(
                    RichText::new(format!("AI: {}", self.ai_model))
                        .size(theme::FONT_SIZE_XS)
                        .color(theme::META),
                );

                // Right-aligned message
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    ui.add_space(theme::SP_3);
                    if !self.message.is_empty() {
                        ui.label(
                            RichText::new(&self.message)
                                .size(theme::FONT_SIZE_XS)
                                .color(theme::FG2),
                        );
                    }
                });
            });
        });
    }
}

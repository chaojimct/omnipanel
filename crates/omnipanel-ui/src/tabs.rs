use egui::{self, RichText, Ui};

use crate::theme;

/// A single tab in the tab bar.
#[derive(Debug, Clone)]
pub struct Tab {
    pub id: usize,
    pub label: String,
    pub closeable: bool,
}

impl Tab {
    pub fn new(id: usize, label: impl Into<String>) -> Self {
        Self {
            id,
            label: label.into(),
            closeable: true,
        }
    }
}

/// Tab bar managing multiple open tabs.
pub struct TabBar {
    pub tabs: Vec<Tab>,
    pub active: usize,
    next_id: usize,
}

impl TabBar {
    pub fn new() -> Self {
        Self {
            tabs: Vec::new(),
            active: 0,
            next_id: 0,
        }
    }

    pub fn add_tab(&mut self, label: impl Into<String>) -> usize {
        let id = self.next_id;
        self.next_id += 1;
        self.tabs.push(Tab::new(id, label));
        self.active = id;
        id
    }

    pub fn close_tab(&mut self, id: usize) {
        if let Some(pos) = self.tabs.iter().position(|t| t.id == id) {
            self.tabs.remove(pos);
            if self.active == id {
                self.active = self.tabs.first().map(|t| t.id).unwrap_or(0);
            }
        }
    }

    pub fn active_label(&self) -> &str {
        self.tabs
            .iter()
            .find(|t| t.id == self.active)
            .map(|t| t.label.as_str())
            .unwrap_or("")
    }

    /// Show the tab bar UI. Returns the ID of a tab that was requested to close, if any.
    pub fn show(&mut self, ui: &mut Ui) -> Option<usize> {
        let mut close_id = None;

        ui.horizontal(|ui| {
            ui.add_space(theme::SP_2);

            for tab in &self.tabs {
                let is_active = self.active == tab.id;

                // Tab styling
                let bg = if is_active {
                    theme::SURFACE
                } else {
                    egui::Color32::TRANSPARENT
                };

                let text_color = if is_active { theme::FG } else { theme::META };

                let frame = egui::Frame::new()
                    .fill(bg)
                    .corner_radius(egui::CornerRadius {
                        nw: theme::R_SM,
                        ne: theme::R_SM,
                        sw: 0,
                        se: 0,
                    })
                    .inner_margin(egui::Margin::symmetric(theme::SP_3 as i8, theme::SP_1 as i8));

                let response = ui.push_id(tab.id, |ui| {
                    frame.show(ui, |ui| {
                        ui.horizontal(|ui| {
                            let label = ui.label(
                                RichText::new(&tab.label)
                                    .size(12.0)
                                    .color(text_color),
                            );

                            if label.clicked() {
                                self.active = tab.id;
                            }

                            if tab.closeable {
                                let close_btn = ui.add_sized(
                                    [16.0, 16.0],
                                    egui::Button::new(
                                        RichText::new("\u{2715}").size(10.0).color(theme::META),
                                    )
                                    .fill(egui::Color32::TRANSPARENT)
                                    .stroke(egui::Stroke::NONE),
                                );
                                if close_btn.clicked() {
                                    close_id = Some(tab.id);
                                }
                            }
                        });
                    });
                });

                // Make entire tab clickable
                if response.response.clicked() {
                    self.active = tab.id;
                }
            }

            // New tab button
            let new_btn = ui.add_sized(
                [24.0, 24.0],
                egui::Button::new(
                    RichText::new("+").size(14.0).color(theme::META),
                )
                .fill(egui::Color32::TRANSPARENT)
                .stroke(egui::Stroke::NONE),
            );

            if new_btn.clicked() {
                self.add_tab("New Terminal");
            }
        });

        // Bottom border
        let rect = ui.max_rect();
        let line_y = rect.bottom();
        ui.painter().line_segment(
            [
                egui::pos2(rect.left(), line_y),
                egui::pos2(rect.right(), line_y),
            ],
            egui::Stroke::new(1.0, theme::BORDER),
        );

        close_id
    }
}

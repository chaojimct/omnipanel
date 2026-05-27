use egui::{Color32, Rect, Ui};

use super::terminal_pass::TerminalScreen;

/// Renders a terminal screen into an egui UI.
pub struct TextRenderer {
    pub font_size: f32,
    pub char_width: f32,
    pub char_height: f32,
}

impl TextRenderer {
    pub fn new(font_size: f32) -> Self {
        // Approximate monospace char dimensions
        let char_width = font_size * 0.6;
        let char_height = font_size * 1.4;
        Self {
            font_size,
            char_width,
            char_height,
        }
    }

    /// Render the terminal screen using egui's painting API.
    pub fn render(&self, ui: &mut Ui, screen: &TerminalScreen) {
        let available = ui.available_size();
        let (response, painter) = ui.allocate_painter(available, egui::Sense::hover());

        let origin = response.rect.min;

        // Background
        painter.rect_filled(response.rect, 0u8, Color32::from_rgb(32, 29, 29));

        // Calculate cell size from available space
        let cell_w = available.x / screen.cols as f32;
        let cell_h = available.y / screen.rows as f32;

        for (row_idx, row) in screen.cells.iter().enumerate() {
            for (col_idx, cell) in row.iter().enumerate() {
                if cell.ch == ' ' {
                    continue;
                }

                let x = origin.x + col_idx as f32 * cell_w;
                let y = origin.y + row_idx as f32 * cell_h;

                let rect = Rect::from_min_size(
                    egui::pos2(x, y),
                    egui::vec2(cell_w, cell_h),
                );

                // Draw character background if different from default
                if cell.bg != Color32::from_rgb(32, 29, 29) {
                    painter.rect_filled(rect, 0u8, cell.bg);
                }

                // Draw character
                let galley = painter.layout_no_wrap(
                    cell.ch.to_string(),
                    egui::FontId::monospace(self.font_size),
                    cell.fg,
                );

                painter.galley(
                    egui::pos2(x, y),
                    galley,
                    cell.fg,
                );
            }
        }

        // Draw cursor
        if screen.cursor_visible && screen.cursor_row < screen.rows && screen.cursor_col < screen.cols
        {
            let cx = origin.x + screen.cursor_col as f32 * cell_w;
            let cy = origin.y + screen.cursor_row as f32 * cell_h;
            let cursor_rect = Rect::from_min_size(
                egui::pos2(cx, cy),
                egui::vec2(cell_w, cell_h),
            );
            painter.rect_filled(cursor_rect, 0u8, Color32::from_rgba_premultiplied(255, 255, 255, 80));
        }
    }
}

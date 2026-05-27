use egui::{self, RichText, Ui};

use crate::panels::Panel;
use crate::theme;
use omnipanel_core::terminal::{Terminal, TerminalConfig};
use omnipanel_renderer::terminal_pass::TerminalScreen;
use omnipanel_renderer::text_renderer::TextRenderer;

use std::sync::{Arc, Mutex};

/// Terminal panel displaying a shell session.
pub struct TerminalPanel {
    pub id: usize,
    terminal: Option<Terminal>,
    screen: Arc<Mutex<TerminalScreen>>,
    renderer: TextRenderer,
    input_buffer: String,
}

impl TerminalPanel {
    pub fn new(id: usize) -> Self {
        let config = TerminalConfig::default();
        let terminal = Terminal::new(config).ok();

        Self {
            id,
            terminal,
            screen: Arc::new(Mutex::new(TerminalScreen::new(120, 40))),
            renderer: TextRenderer::new(theme::FONT_SIZE_TERMINAL),
            input_buffer: String::new(),
        }
    }

    /// Poll terminal output and update the screen.
    fn poll_output(&mut self) {
        if let Some(ref mut term) = self.terminal {
            if let Ok(n) = term.try_read_output() {
                if n > 0 {
                    let output = term.output();
                    self.screen.lock().unwrap().update_from_bytes(&output);
                }
            }
        }
    }
}

impl Panel for TerminalPanel {
    fn id(&self) -> &str {
        "terminal"
    }

    fn label(&self) -> &str {
        "Terminal"
    }

    fn show(&mut self, ui: &mut Ui) {
        // Poll for new output
        self.poll_output();

        let is_alive = self.terminal.as_mut().map(|t| t.is_alive()).unwrap_or(false);

        if !is_alive {
            // Show "terminal exited" state
            ui.centered_and_justified(|ui| {
                ui.label(
                    RichText::new("Terminal process exited")
                        .size(theme::FONT_SIZE)
                        .color(theme::META),
                );
            });
            return;
        }

        // Input area at the bottom
        egui::TopBottomPanel::bottom("term_input").show_inside(ui, |ui| {
            ui.horizontal(|ui| {
                ui.label(
                    RichText::new("$")
                        .size(theme::FONT_SIZE)
                        .color(theme::ACCENT)
                        .strong(),
                );

                let response = ui.add_sized(
                    [ui.available_width(), 24.0],
                    egui::TextEdit::singleline(&mut self.input_buffer)
                        .font(egui::FontId::monospace(theme::FONT_SIZE))
                        .hint_text("Type command..."),
                );

                // Submit on Enter
                if response.lost_focus() && ui.input(|i| i.key_pressed(egui::Key::Enter)) {
                    if let Some(ref mut term) = self.terminal {
                        let cmd = format!("{}\n", self.input_buffer);
                        let _ = term.write_input(cmd.as_bytes());
                        self.input_buffer.clear();
                    }
                    response.request_focus();
                }

                // Focus the input on panel click
                if ui.ctx().input(|i| i.key_pressed(egui::Key::Enter)) {
                    response.request_focus();
                }
            });
        });

        // Terminal output area
        let screen = self.screen.lock().unwrap().clone();
        self.renderer.render(ui, &screen);
    }
}

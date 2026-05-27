use egui::{self, Ui};

use crate::panels::terminal::TerminalPanel;
use crate::panels::Panel;
use crate::sidebar::Sidebar;
use crate::statusbar::StatusBar;
use crate::tabs::TabBar;
use crate::theme;
use crate::topbar::Topbar;

/// The main OmniPanel application.
pub struct OmniPanelApp {
    sidebar: Sidebar,
    topbar: Topbar,
    tab_bar: TabBar,
    status_bar: StatusBar,
    terminal_panels: Vec<TerminalPanel>,
    next_terminal_id: usize,
}

impl OmniPanelApp {
    pub fn new(cc: &eframe::CreationContext<'_>) -> Self {
        // Apply theme
        theme::apply_theme(&cc.egui_ctx);

        let mut tab_bar = TabBar::new();
        let mut terminal_panels = Vec::new();

        // Create default terminal tab
        let term_id = 0;
        tab_bar.add_tab("Terminal 1");
        terminal_panels.push(TerminalPanel::new(term_id));

        Self {
            sidebar: Sidebar::new(),
            topbar: Topbar::new(),
            tab_bar,
            status_bar: StatusBar::new(),
            terminal_panels,
            next_terminal_id: 1,
        }
    }

    fn show_main_content(&mut self, ui: &mut Ui) {
        // Tab bar
        let close_id = self.tab_bar.show(ui);

        // Handle tab close
        if let Some(id) = close_id {
            self.tab_bar.close_tab(id);
            self.terminal_panels.retain(|p| p.id != id);
        }

        ui.add_space(theme::SP_1);

        // Active panel content
        let active_tab = self.tab_bar.active;

        // Find and show the active terminal panel
        if let Some(panel) = self.terminal_panels.iter_mut().find(|p| p.id == active_tab) {
            panel.show(ui);
        } else if self.terminal_panels.is_empty() {
            // Empty state
            ui.centered_and_justified(|ui| {
                ui.vertical_centered(|ui| {
                    ui.add_space(80.0);
                    ui.label(
                        egui::RichText::new("Welcome to OmniPanel")
                            .size(20.0)
                            .color(theme::FG)
                            .strong(),
                    );
                    ui.add_space(theme::SP_3);
                    ui.label(
                        egui::RichText::new("Press + to open a new terminal")
                            .size(theme::FONT_SIZE)
                            .color(theme::META),
                    );
                });
            });
        }
    }
}

impl eframe::App for OmniPanelApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // Request repaint for live terminal output
        ctx.request_repaint();

        // Handle Ctrl+K for command palette
        if ctx.input(|i| i.key_pressed(egui::Key::K) && i.modifiers.ctrl) {
            self.topbar.show_command_palette = !self.topbar.show_command_palette;
        }

        // Handle new terminal shortcut
        if ctx.input(|i| i.key_pressed(egui::Key::T) && i.modifiers.ctrl) {
            let id = self.next_terminal_id;
            self.next_terminal_id += 1;
            self.tab_bar.add_tab(format!("Terminal {}", id + 1));
            self.terminal_panels.push(TerminalPanel::new(id));
        }

        // Sidebar
        egui::SidePanel::left("sidebar")
            .resizable(false)
            .exact_width(if self.sidebar.expanded {
                theme::SIDEBAR_EXPANDED
            } else {
                theme::SIDEBAR_W
            })
            .show(ctx, |ui| {
                self.sidebar.show(ui);
            });

        // Status bar (bottom)
        egui::TopBottomPanel::bottom("statusbar")
            .exact_height(24.0)
            .show(ctx, |ui| {
                self.status_bar.show(ui);
            });

        // Top bar
        egui::TopBottomPanel::top("topbar")
            .exact_height(36.0)
            .show(ctx, |ui| {
                self.topbar.show(ui);
            });

        // Main content area
        egui::CentralPanel::default().show(ctx, |ui| {
            self.show_main_content(ui);
        });
    }
}

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::process::Command as StdCommand;

#[derive(Serialize)]
struct DaemonStatus {
    running: bool,
    pid: Option<u32>,
    error: Option<String>,
}

#[tauri::command]
fn daemon_status() -> Result<String, String> {
    let output = StdCommand::new("openzoo")
        .arg("daemon")
        .arg("status")
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("running".to_string())
    } else {
        Ok("stopped".to_string())
    }
}

#[tauri::command]
fn daemon_start() -> Result<String, String> {
    let output = StdCommand::new("openzoo")
        .arg("daemon")
        .arg("start")
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(format!("Daemon started (PID: {:?})", output.id()))
}

#[tauri::command]
fn daemon_stop() -> Result<String, String> {
    let output = StdCommand::new("openzoo")
        .arg("daemon")
        .arg("stop")
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("Daemon stopped".to_string())
    } else {
        Err("Failed to stop daemon".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![daemon_status, daemon_start, daemon_stop])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

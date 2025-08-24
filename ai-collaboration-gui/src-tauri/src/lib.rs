use log::info;
use env_logger;

mod commands;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logger
    env_logger::init();
    
    info!("Starting AI Collaboration GUI");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Original commands
            greet,
            
            // Project management commands
            commands::load_projects,
            commands::create_project,
            commands::update_project,
            commands::delete_project,
            commands::get_project_by_id,
            
            // AI Tools commands
            commands::initialize_ai_tool,
            commands::connect_ai_tool,
            commands::disconnect_ai_tool,
            commands::send_ai_command,
            commands::get_ai_tools,
            commands::update_ai_tool_status,
            
            // Swarm management commands
            commands::create_swarm,
            commands::get_swarms,
            commands::execute_swarm_task,
            commands::pause_swarm,
            commands::resume_swarm,
            commands::stop_swarm,
            commands::add_agent_to_swarm,
            commands::remove_agent_from_swarm,
            commands::query_swarm_memory,
            
            // System commands
            commands::read_directory,
            commands::read_file_content,
            commands::write_file_content,
            commands::create_directory,
            commands::delete_file_or_directory,
            commands::execute_command,
            commands::get_system_info,
            commands::check_tool_availability,
            commands::get_environment_variables,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

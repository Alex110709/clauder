use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use anyhow::{Result, Context};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileItem {
    pub id: String,
    pub name: String,
    pub path: String,
    pub file_type: String, // 'file' | 'directory'
    pub size: Option<u64>,
    pub modified: Option<DateTime<Utc>>,
    pub children: Option<Vec<FileItem>>,
    pub expanded: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub id: String,
    pub name: String,
    pub command: String,
    pub status: String, // 'running' | 'stopped' | 'failed'
    pub pid: Option<u32>,
    pub started_at: DateTime<Utc>,
    pub output: Vec<String>,
}

#[tauri::command]
pub async fn read_directory(path: String) -> Result<Vec<FileItem>, String> {
    log::info!("Reading directory: {}", path);
    
    let dir_path = PathBuf::from(&path);
    if !dir_path.exists() {
        return Err("Directory does not exist".to_string());
    }
    
    if !dir_path.is_dir() {
        return Err("Path is not a directory".to_string());
    }
    
    let mut items = Vec::new();
    
    let entries = fs::read_dir(&dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry.metadata()
            .map_err(|e| format!("Failed to read metadata: {}", e))?;
        
        let file_name = entry.file_name().to_string_lossy().to_string();
        let file_path = entry.path().to_string_lossy().to_string();
        
        let file_type = if metadata.is_dir() {
            "directory".to_string()
        } else {
            "file".to_string()
        };
        
        let size = if metadata.is_file() {
            Some(metadata.len())
        } else {
            None
        };
        
        let modified = metadata.modified()
            .ok()
            .and_then(|time| {
                time.duration_since(std::time::UNIX_EPOCH)
                    .ok()
                    .map(|duration| {
                        DateTime::from_timestamp(duration.as_secs() as i64, 0)
                            .unwrap_or_else(|| Utc::now())
                    })
            });
        
        items.push(FileItem {
            id: uuid::Uuid::new_v4().to_string(),
            name: file_name,
            path: file_path,
            file_type,
            size,
            modified,
            children: None,
            expanded: Some(false),
        });
    }
    
    // Sort: directories first, then files, both alphabetically
    items.sort_by(|a, b| {
        match (a.file_type.as_str(), b.file_type.as_str()) {
            ("directory", "file") => std::cmp::Ordering::Less,
            ("file", "directory") => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        }
    });
    
    Ok(items)
}

#[tauri::command]
pub async fn read_file_content(path: String) -> Result<String, String> {
    log::info!("Reading file content: {}", path);
    
    let file_path = PathBuf::from(&path);
    if !file_path.exists() {
        return Err("File does not exist".to_string());
    }
    
    if !file_path.is_file() {
        return Err("Path is not a file".to_string());
    }
    
    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    Ok(content)
}

#[tauri::command]
pub async fn write_file_content(path: String, content: String) -> Result<(), String> {
    log::info!("Writing file content: {}", path);
    
    let file_path = PathBuf::from(&path);
    
    // Create parent directories if they don't exist
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }
    
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    log::info!("Creating directory: {}", path);
    
    let dir_path = PathBuf::from(&path);
    
    fs::create_dir_all(&dir_path)
        .map_err(|e| format!("Failed to create directory: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn delete_file_or_directory(path: String) -> Result<(), String> {
    log::info!("Deleting file or directory: {}", path);
    
    let target_path = PathBuf::from(&path);
    
    if !target_path.exists() {
        return Err("Path does not exist".to_string());
    }
    
    if target_path.is_dir() {
        fs::remove_dir_all(&target_path)
            .map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else {
        fs::remove_file(&target_path)
            .map_err(|e| format!("Failed to delete file: {}", e))?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn execute_command(command: String, args: Vec<String>, working_dir: Option<String>) -> Result<ProcessInfo, String> {
    log::info!("Executing command: {} {:?}", command, args);
    
    let mut cmd = Command::new(&command);
    cmd.args(&args);
    
    if let Some(dir) = working_dir {
        cmd.current_dir(dir);
    }
    
    let output = cmd.output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    
    let mut output_lines = Vec::new();
    if !stdout.is_empty() {
        output_lines.extend(stdout.lines().map(|s| s.to_string()));
    }
    if !stderr.is_empty() {
        output_lines.extend(stderr.lines().map(|s| format!("ERROR: {}", s)));
    }
    
    let status = if output.status.success() {
        "completed".to_string()
    } else {
        "failed".to_string()
    };
    
    let process_info = ProcessInfo {
        id: uuid::Uuid::new_v4().to_string(),
        name: command.clone(),
        command: format!("{} {}", command, args.join(" ")),
        status,
        pid: None, // Not available for completed processes
        started_at: Utc::now(),
        output: output_lines,
    };
    
    Ok(process_info)
}

#[tauri::command]
pub async fn get_system_info() -> Result<serde_json::Value, String> {
    log::info!("Getting system info");
    
    let system_info = serde_json::json!({
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "current_dir": std::env::current_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|_| "unknown".to_string()),
        "timestamp": Utc::now(),
    });
    
    Ok(system_info)
}

#[tauri::command]
pub async fn check_tool_availability(tool_name: String) -> Result<bool, String> {
    log::info!("Checking tool availability: {}", tool_name);
    
    let output = Command::new("which")
        .arg(&tool_name)
        .output();
    
    match output {
        Ok(output) => Ok(output.status.success()),
        Err(_) => {
            // Try with 'where' on Windows
            let output = Command::new("where")
                .arg(&tool_name)
                .output();
            
            match output {
                Ok(output) => Ok(output.status.success()),
                Err(_) => Ok(false),
            }
        }
    }
}

#[tauri::command]
pub async fn get_environment_variables() -> Result<serde_json::Value, String> {
    log::info!("Getting environment variables");
    
    let mut env_vars = serde_json::Map::new();
    
    // Only include relevant environment variables for AI tools
    let relevant_vars = [
        "ANTHROPIC_API_KEY",
        "OPENAI_API_KEY", 
        "GOOGLE_API_KEY",
        "PATH",
        "HOME",
        "USER",
        "SHELL",
    ];
    
    for var in relevant_vars.iter() {
        if let Ok(value) = std::env::var(var) {
            // Mask sensitive values
            let masked_value = if var.contains("API_KEY") {
                if value.len() > 8 {
                    format!("{}...{}", &value[..4], &value[value.len()-4..])
                } else {
                    "***".to_string()
                }
            } else {
                value
            };
            env_vars.insert(var.to_string(), serde_json::Value::String(masked_value));
        }
    }
    
    Ok(serde_json::Value::Object(env_vars))
}
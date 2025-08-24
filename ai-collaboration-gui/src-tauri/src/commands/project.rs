use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub settings: ProjectSettings,
    pub ai_tools: Vec<AIToolConfig>,
    pub sessions: Vec<SessionSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSettings {
    pub default_ai_tool: String,
    pub auto_save: bool,
    pub collaboration_mode: String, // 'single' | 'swarm' | 'sequential'
    pub memory_retention: i32, // days
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIToolConfig {
    pub tool_id: String,
    pub enabled: bool,
    pub priority: i32,
    pub custom_settings: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSummary {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub last_active: DateTime<Utc>,
    pub message_count: i32,
    pub status: String, // 'active' | 'completed' | 'paused'
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectConfig {
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub settings: Option<ProjectSettings>,
}

#[tauri::command]
pub async fn load_projects() -> Result<Vec<Project>, String> {
    log::info!("Loading projects");
    
    // TODO: Replace with actual database query
    let projects = mock_load_projects().await
        .map_err(|e| format!("Failed to load projects: {}", e))?;
    
    Ok(projects)
}

#[tauri::command]
pub async fn create_project(config: ProjectConfig) -> Result<Project, String> {
    log::info!("Creating project: {}", config.name);
    
    // Validate project path
    let path = PathBuf::from(&config.path);
    if !path.exists() {
        return Err("Project path does not exist".to_string());
    }
    
    // TODO: Replace with actual database insertion
    let project = mock_create_project(config).await
        .map_err(|e| format!("Failed to create project: {}", e))?;
    
    Ok(project)
}

#[tauri::command]
pub async fn update_project(project_id: String, updates: HashMap<String, serde_json::Value>) -> Result<Project, String> {
    log::info!("Updating project: {}", project_id);
    
    // TODO: Replace with actual database update
    let project = mock_update_project(project_id, updates).await
        .map_err(|e| format!("Failed to update project: {}", e))?;
    
    Ok(project)
}

#[tauri::command]
pub async fn delete_project(project_id: String) -> Result<(), String> {
    log::info!("Deleting project: {}", project_id);
    
    // TODO: Replace with actual database deletion
    mock_delete_project(project_id).await
        .map_err(|e| format!("Failed to delete project: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_project_by_id(project_id: String) -> Result<Option<Project>, String> {
    log::info!("Getting project by ID: {}", project_id);
    
    // TODO: Replace with actual database query
    let project = mock_get_project_by_id(project_id).await
        .map_err(|e| format!("Failed to get project: {}", e))?;
    
    Ok(project)
}

// Mock implementations - these will be replaced with actual database operations
async fn mock_load_projects() -> Result<Vec<Project>> {
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    let project = Project {
        id: Uuid::new_v4().to_string(),
        name: "Sample Project".to_string(),
        path: "/tmp/sample".to_string(),
        description: Some("A sample project for testing".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        settings: ProjectSettings {
            default_ai_tool: "claude-code".to_string(),
            auto_save: true,
            collaboration_mode: "swarm".to_string(),
            memory_retention: 30,
        },
        ai_tools: vec![],
        sessions: vec![],
    };
    
    Ok(vec![project])
}

async fn mock_create_project(config: ProjectConfig) -> Result<Project> {
    tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
    
    let now = Utc::now();
    let project = Project {
        id: Uuid::new_v4().to_string(),
        name: config.name,
        path: config.path,
        description: config.description,
        created_at: now,
        updated_at: now,
        settings: config.settings.unwrap_or(ProjectSettings {
            default_ai_tool: "claude-code".to_string(),
            auto_save: true,
            collaboration_mode: "single".to_string(),
            memory_retention: 30,
        }),
        ai_tools: vec![],
        sessions: vec![],
    };
    
    Ok(project)
}

async fn mock_update_project(project_id: String, _updates: HashMap<String, serde_json::Value>) -> Result<Project> {
    tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    
    // This is a simplified mock implementation
    let now = Utc::now();
    let project = Project {
        id: project_id,
        name: "Updated Project".to_string(),
        path: "/tmp/updated".to_string(),
        description: Some("Updated project".to_string()),
        created_at: now,
        updated_at: now,
        settings: ProjectSettings {
            default_ai_tool: "claude-code".to_string(),
            auto_save: true,
            collaboration_mode: "single".to_string(),
            memory_retention: 30,
        },
        ai_tools: vec![],
        sessions: vec![],
    };
    
    Ok(project)
}

async fn mock_delete_project(_project_id: String) -> Result<()> {
    tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    Ok(())
}

async fn mock_get_project_by_id(project_id: String) -> Result<Option<Project>> {
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    let project = Project {
        id: project_id,
        name: "Sample Project".to_string(),
        path: "/tmp/sample".to_string(),
        description: Some("A sample project".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        settings: ProjectSettings {
            default_ai_tool: "claude-code".to_string(),
            auto_save: true,
            collaboration_mode: "single".to_string(),
            memory_retention: 30,
        },
        ai_tools: vec![],
        sessions: vec![],
    };
    
    Ok(Some(project))
}
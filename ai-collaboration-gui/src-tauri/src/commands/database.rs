use crate::database::*;
use tauri::command;
use serde::{Deserialize, Serialize};
use chrono::Utc;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectCreateRequest {
    pub name: String,
    pub path: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatSessionCreateRequest {
    pub name: String,
    pub project_id: Option<String>,
    pub swarm_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessageCreateRequest {
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub metadata: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SwarmCreateRequest {
    pub name: String,
    pub project_id: String,
    pub objective: String,
    pub config: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIToolConfigRequest {
    pub tool_name: String,
    pub config: String,
    pub is_connected: bool,
}

// 프로젝트 관련 명령어들
#[command]
pub async fn db_create_project(request: ProjectCreateRequest) -> Result<String, String> {
    let now = Utc::now();
    let project = DbProject {
        id: Uuid::new_v4().to_string(),
        name: request.name,
        path: request.path,
        description: request.description,
        created_at: now,
        updated_at: now,
    };

    create_project(&project)
        .map_err(|e| format!("Failed to create project: {}", e))?;

    Ok(project.id)
}

#[command]
pub async fn db_get_all_projects() -> Result<Vec<DbProject>, String> {
    get_all_projects()
        .map_err(|e| format!("Failed to get projects: {}", e))
}

#[command]
pub async fn db_update_project(project: DbProject) -> Result<(), String> {
    let mut updated_project = project;
    updated_project.updated_at = Utc::now();
    
    update_project(&updated_project)
        .map_err(|e| format!("Failed to update project: {}", e))
}

#[command]
pub async fn db_delete_project(project_id: String) -> Result<(), String> {
    delete_project(&project_id)
        .map_err(|e| format!("Failed to delete project: {}", e))
}

// 채팅 세션 관련 명령어들
#[command]
pub async fn db_create_chat_session(request: ChatSessionCreateRequest) -> Result<String, String> {
    let now = Utc::now();
    let session = DbChatSession {
        id: Uuid::new_v4().to_string(),
        name: request.name,
        project_id: request.project_id,
        swarm_id: request.swarm_id,
        created_at: now,
        updated_at: now,
    };

    create_chat_session(&session)
        .map_err(|e| format!("Failed to create chat session: {}", e))?;

    Ok(session.id)
}

#[command]
pub async fn db_get_chat_sessions(project_id: Option<String>) -> Result<Vec<DbChatSession>, String> {
    get_chat_sessions_by_project(project_id.as_deref())
        .map_err(|e| format!("Failed to get chat sessions: {}", e))
}

// 채팅 메시지 관련 명령어들
#[command]
pub async fn db_create_chat_message(request: ChatMessageCreateRequest) -> Result<String, String> {
    let message = DbChatMessage {
        id: Uuid::new_v4().to_string(),
        session_id: request.session_id,
        role: request.role,
        content: request.content,
        metadata: request.metadata,
        timestamp: Utc::now(),
    };

    create_chat_message(&message)
        .map_err(|e| format!("Failed to create chat message: {}", e))?;

    Ok(message.id)
}

#[command]
pub async fn db_get_chat_messages(session_id: String) -> Result<Vec<DbChatMessage>, String> {
    get_chat_messages(&session_id)
        .map_err(|e| format!("Failed to get chat messages: {}", e))
}

// 스웜 관련 명령어들
#[command]
pub async fn db_create_swarm(request: SwarmCreateRequest) -> Result<String, String> {
    let now = Utc::now();
    let swarm = DbSwarm {
        id: Uuid::new_v4().to_string(),
        name: request.name,
        project_id: request.project_id,
        objective: request.objective,
        status: "initializing".to_string(),
        config: request.config,
        created_at: now,
        updated_at: now,
    };

    create_swarm(&swarm)
        .map_err(|e| format!("Failed to create swarm: {}", e))?;

    Ok(swarm.id)
}

#[command]
pub async fn db_get_swarms(project_id: String) -> Result<Vec<DbSwarm>, String> {
    get_swarms_by_project(&project_id)
        .map_err(|e| format!("Failed to get swarms: {}", e))
}

#[command]
pub async fn db_update_swarm_status(swarm_id: String, status: String) -> Result<(), String> {
    // 먼저 스웜을 조회한 후 상태 업데이트
    // 실제 구현에서는 더 효율적인 UPDATE 쿼리 사용
    log::info!("Updating swarm {} status to {}", swarm_id, status);
    Ok(())
}

// AI 도구 설정 관련 명령어들
#[command]
pub async fn db_save_ai_tool_config(request: AIToolConfigRequest) -> Result<String, String> {
    let now = Utc::now();
    let config = DbAIToolConfig {
        id: Uuid::new_v4().to_string(),
        tool_name: request.tool_name,
        config: request.config,
        is_connected: request.is_connected,
        created_at: now,
        updated_at: now,
    };

    save_ai_tool_config(&config)
        .map_err(|e| format!("Failed to save AI tool config: {}", e))?;

    Ok(config.id)
}

#[command]
pub async fn db_get_ai_tool_configs() -> Result<Vec<DbAIToolConfig>, String> {
    get_ai_tool_configs()
        .map_err(|e| format!("Failed to get AI tool configs: {}", e))
}

// 데이터베이스 초기화 명령어
#[command]
pub async fn db_initialize() -> Result<(), String> {
    // 애플리케이션 데이터 디렉토리에 데이터베이스 파일 생성
    let app_data_dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .ok_or("Failed to get app data directory")?;
    
    // 디렉토리가 없으면 생성
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    let db_path = app_data_dir.join("ai_collaboration.db");
    
    initialize_database(&db_path)
        .map_err(|e| format!("Failed to initialize database: {}", e))?;

    log::info!("Database initialized at: {:?}", db_path);
    Ok(())
}

// 데이터베이스 통계 조회
#[command]
pub async fn db_get_statistics() -> Result<DatabaseStatistics, String> {
    let projects = get_all_projects()
        .map_err(|e| format!("Failed to get projects: {}", e))?;
    
    let chat_sessions = get_chat_sessions_by_project(None)
        .map_err(|e| format!("Failed to get chat sessions: {}", e))?;
    
    let ai_configs = get_ai_tool_configs()
        .map_err(|e| format!("Failed to get AI tool configs: {}", e))?;

    Ok(DatabaseStatistics {
        total_projects: projects.len(),
        total_chat_sessions: chat_sessions.len(),
        total_ai_tools: ai_configs.len(),
        connected_ai_tools: ai_configs.iter().filter(|c| c.is_connected).count(),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseStatistics {
    pub total_projects: usize,
    pub total_chat_sessions: usize,
    pub total_ai_tools: usize,
    pub connected_ai_tools: usize,
}
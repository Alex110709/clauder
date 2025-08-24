use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::path::Path;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use once_cell::sync::Lazy;
use std::sync::Mutex;
use anyhow::anyhow;

// 데이터베이스 연결을 위한 전역 변수
static DB_CONNECTION: Lazy<Mutex<Option<Connection>>> = Lazy::new(|| Mutex::new(None));

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbProject {
    pub id: String,
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbChatSession {
    pub id: String,
    pub name: String,
    pub project_id: Option<String>,
    pub swarm_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbChatMessage {
    pub id: String,
    pub session_id: String,
    pub role: String, // 'user', 'assistant', 'system'
    pub content: String,
    pub metadata: Option<String>, // JSON string
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbSwarm {
    pub id: String,
    pub name: String,
    pub project_id: String,
    pub objective: String,
    pub status: String,
    pub config: String, // JSON string
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbAIToolConfig {
    pub id: String,
    pub tool_name: String,
    pub config: String, // JSON string
    pub is_connected: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// 데이터베이스 초기화
pub fn initialize_database(db_path: &Path) -> Result<(), anyhow::Error> {
    let conn = Connection::open(db_path)?;
    
    // 테이블 생성
    create_tables(&conn)?;
    
    // 전역 연결 설정
    let mut db_conn = DB_CONNECTION.lock().unwrap();
    *db_conn = Some(conn);
    
    log::info!("Database initialized at: {:?}", db_path);
    Ok(())
}

fn create_tables(conn: &Connection) -> Result<(), rusqlite::Error> {
    // Projects 테이블
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // Chat Sessions 테이블
    conn.execute(
        "CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            project_id TEXT,
            swarm_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )",
        [],
    )?;

    // Chat Messages 테이블
    conn.execute(
        "CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            metadata TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
        )",
        [],
    )?;

    // Swarms 테이블
    conn.execute(
        "CREATE TABLE IF NOT EXISTS swarms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            project_id TEXT NOT NULL,
            objective TEXT NOT NULL,
            status TEXT NOT NULL,
            config TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )",
        [],
    )?;

    // AI Tool Configurations 테이블
    conn.execute(
        "CREATE TABLE IF NOT EXISTS ai_tool_configs (
            id TEXT PRIMARY KEY,
            tool_name TEXT NOT NULL UNIQUE,
            config TEXT NOT NULL,
            is_connected BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // 인덱스 생성
    conn.execute("CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_chat_sessions_project ON chat_sessions(project_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_swarms_project ON swarms(project_id)", [])?;
    
    log::info!("Database tables created successfully");
    Ok(())
}

// 프로젝트 관련 함수들
pub fn create_project(project: &DbProject) -> Result<(), anyhow::Error> {
    let db_conn = DB_CONNECTION.lock().unwrap();
    let conn = db_conn.as_ref().ok_or_else(|| anyhow!("Database not initialized"))?;
    
    conn.execute(
        "INSERT INTO projects (id, name, path, description, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            project.id,
            project.name,
            project.path,
            project.description,
            project.created_at.to_rfc3339(),
            project.updated_at.to_rfc3339()
        ],
    )?;
    
    log::info!("Project created: {}", project.name);
    Ok(())
}

pub fn get_all_projects() -> Result<Vec<DbProject>, anyhow::Error> {
    let db_conn = DB_CONNECTION.lock().unwrap();
    let conn = db_conn.as_ref().ok_or_else(|| anyhow!("Database not initialized"))?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, path, description, created_at, updated_at FROM projects ORDER BY updated_at DESC"
    )?;
    
    let project_iter = stmt.query_map([], |row| {
        Ok(DbProject {
            id: row.get(0)?,
            name: row.get(1)?,
            path: row.get(2)?,
            description: row.get(3)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                .map_err(|e| rusqlite::Error::InvalidColumnType(4, "created_at".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                .map_err(|e| rusqlite::Error::InvalidColumnType(5, "updated_at".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
        })
    })?;
    
    let mut projects = Vec::new();
    for project in project_iter {
        projects.push(project?);
    }
    
    Ok(projects)
}

pub fn update_project(project: &DbProject) -> Result<(), anyhow::Error> {
    let db_conn = DB_CONNECTION.lock().unwrap();
    let conn = db_conn.as_ref().ok_or_else(|| anyhow!("Database not initialized"))?;
    
    conn.execute(
        "UPDATE projects SET name = ?1, path = ?2, description = ?3, updated_at = ?4 WHERE id = ?5",
        params![
            project.name,
            project.path,
            project.description,
            project.updated_at.to_rfc3339(),
            project.id
        ],
    )?;
    
    log::info!("Project updated: {}", project.name);
    Ok(())
}

pub fn delete_project(project_id: &str) -> Result<(), anyhow::Error> {
    let db_conn = DB_CONNECTION.lock().unwrap();
    let conn = db_conn.as_ref().ok_or_else(|| anyhow!("Database not initialized"))?;
    
    conn.execute("DELETE FROM projects WHERE id = ?1", params![project_id])?;
    
    log::info!("Project deleted: {}", project_id);
    Ok(())
}

// 채팅 세션 관련 함수들
pub fn create_chat_session(session: &DbChatSession) -> Result<(), anyhow::Error> {
    let db_conn = DB_CONNECTION.lock().unwrap();
    let conn = db_conn.as_ref().ok_or_else(|| anyhow!("Database not initialized"))?;
    
    conn.execute(
        "INSERT INTO chat_sessions (id, name, project_id, swarm_id, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            session.id,
            session.name,
            session.project_id,
            session.swarm_id,
            session.created_at.to_rfc3339(),
            session.updated_at.to_rfc3339()
        ],
    )?;
    
    Ok(())
}

pub fn get_chat_sessions_by_project(project_id: Option<&str>) -> Result<Vec<DbChatSession>, anyhow::Error> {
    let db_conn = DB_CONNECTION.lock().unwrap();
    let conn = db_conn.as_ref().ok_or_else(|| anyhow!("Database not initialized"))?;
    
    let mut stmt = if let Some(pid) = project_id {
        conn.prepare(
            "SELECT id, name, project_id, swarm_id, created_at, updated_at 
             FROM chat_sessions WHERE project_id = ? ORDER BY updated_at DESC"
        )?
    } else {
        conn.prepare(
            "SELECT id, name, project_id, swarm_id, created_at, updated_at 
             FROM chat_sessions ORDER BY updated_at DESC"
        )?
    };
    
    let session_iter = if let Some(pid) = project_id {
        stmt.query_map(params![pid], |row| {
            Ok(DbChatSession {
                id: row.get(0)?,
                name: row.get(1)?,
                project_id: row.get(2)?,
                swarm_id: row.get(3)?,
                created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                    .map_err(|_| rusqlite::Error::InvalidColumnType(4, "created_at".to_string(), rusqlite::types::Type::Text))?
                    .with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                    .map_err(|_| rusqlite::Error::InvalidColumnType(5, "updated_at".to_string(), rusqlite::types::Type::Text))?
                    .with_timezone(&Utc),
            })
        })?
    } else {
        stmt.query_map([], |row| {
            Ok(DbChatSession {
                id: row.get(0)?,
                name: row.get(1)?,
                project_id: row.get(2)?,
                swarm_id: row.get(3)?,
                created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                    .map_err(|_| rusqlite::Error::InvalidColumnType(4, "created_at".to_string(), rusqlite::types::Type::Text))?
                    .with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                    .map_err(|_| rusqlite::Error::InvalidColumnType(5, "updated_at".to_string(), rusqlite::types::Type::Text))?
                    .with_timezone(&Utc),
            })
        })?
    };
    
    let mut sessions = Vec::new();
    for session in session_iter {
        sessions.push(session?);
    }
    
    Ok(sessions)
}

// 채팅 메시지 관련 함수들
pub fn create_chat_message(message: &DbChatMessage) -> Result<(), anyhow::Error> {
    let db_conn = DB_CONNECTION.lock().unwrap();
    let conn = db_conn.as_ref().ok_or_else(|| anyhow!("Database not initialized"))?;
    
    conn.execute(
        "INSERT INTO chat_messages (id, session_id, role, content, metadata, timestamp) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            message.id,
            message.session_id,
            message.role,
            message.content,
            message.metadata,
            message.timestamp.to_rfc3339()
        ],
    )?;
    
    Ok(())
}

pub fn get_chat_messages(session_id: &str) -> Result<Vec<DbChatMessage>, anyhow::Error> {
    let db_conn = DB_CONNECTION.lock().unwrap();
    let conn = db_conn.as_ref().ok_or_else(|| anyhow!("Database not initialized"))?;
    
    let mut stmt = conn.prepare(
        "SELECT id, session_id, role, content, metadata, timestamp 
         FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC"
    )?;
    
    let message_iter = stmt.query_map(params![session_id], |row| {
        Ok(DbChatMessage {
            id: row.get(0)?,
            session_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            metadata: row.get(4)?,
            timestamp: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(5, "timestamp".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
        })
    })?;
    
    let mut messages = Vec::new();
    for message in message_iter {
        messages.push(message?);
    }
    
    Ok(messages)
}

// 스웜 관련 함수들
pub fn create_swarm(swarm: &DbSwarm) -> Result<(), anyhow::Error> {
    let db_conn = DB_CONNECTION.lock().unwrap();
    let conn = db_conn.as_ref().ok_or_else(|| anyhow!("Database not initialized"))?;
    
    conn.execute(
        "INSERT INTO swarms (id, name, project_id, objective, status, config, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            swarm.id,
            swarm.name,
            swarm.project_id,
            swarm.objective,
            swarm.status,
            swarm.config,
            swarm.created_at.to_rfc3339(),
            swarm.updated_at.to_rfc3339()
        ],
    )?;
    
    Ok(())
}

pub fn get_swarms_by_project(project_id: &str) -> Result<Vec<DbSwarm>, anyhow::Error> {
    let db_conn = DB_CONNECTION.lock().unwrap();
    let conn = db_conn.as_ref().ok_or_else(|| anyhow!("Database not initialized"))?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, project_id, objective, status, config, created_at, updated_at 
         FROM swarms WHERE project_id = ? ORDER BY updated_at DESC"
    )?;
    
    let swarm_iter = stmt.query_map(params![project_id], |row| {
        Ok(DbSwarm {
            id: row.get(0)?,
            name: row.get(1)?,
            project_id: row.get(2)?,
            objective: row.get(3)?,
            status: row.get(4)?,
            config: row.get(5)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(6, "created_at".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(7, "updated_at".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
        })
    })?;
    
    let mut swarms = Vec::new();
    for swarm in swarm_iter {
        swarms.push(swarm?);
    }
    
    Ok(swarms)
}

// AI 도구 설정 관련 함수들
pub fn save_ai_tool_config(config: &DbAIToolConfig) -> Result<(), anyhow::Error> {
    let db_conn = DB_CONNECTION.lock().unwrap();
    let conn = db_conn.as_ref().ok_or_else(|| anyhow!("Database not initialized"))?;
    
    conn.execute(
        "INSERT OR REPLACE INTO ai_tool_configs (id, tool_name, config, is_connected, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            config.id,
            config.tool_name,
            config.config,
            config.is_connected,
            config.created_at.to_rfc3339(),
            config.updated_at.to_rfc3339()
        ],
    )?;
    
    Ok(())
}

pub fn get_ai_tool_configs() -> Result<Vec<DbAIToolConfig>, anyhow::Error> {
    let db_conn = DB_CONNECTION.lock().unwrap();
    let conn = db_conn.as_ref().ok_or_else(|| anyhow!("Database not initialized"))?;
    
    let mut stmt = conn.prepare(
        "SELECT id, tool_name, config, is_connected, created_at, updated_at 
         FROM ai_tool_configs ORDER BY tool_name"
    )?;
    
    let config_iter = stmt.query_map([], |row| {
        Ok(DbAIToolConfig {
            id: row.get(0)?,
            tool_name: row.get(1)?,
            config: row.get(2)?,
            is_connected: row.get(3)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(4, "created_at".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(5, "updated_at".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
        })
    })?;
    
    let mut configs = Vec::new();
    for config in config_iter {
        configs.push(config?);
    }
    
    Ok(configs)
}
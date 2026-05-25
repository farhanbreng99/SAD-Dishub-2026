-- ===================================================================
-- E-Internship Dishub
-- PostgreSQL Schema Definitions (DDL)
-- ===================================================================

CREATE TYPE user_role AS ENUM ('applicant', 'admin', 'head');
CREATE TYPE applicant_type AS ENUM ('slta', 'mahasiswa', 'fresh_graduate', 'instansi');
CREATE TYPE application_status AS ENUM ('pending', 'reviewing', 'accepted', 'rejected');
CREATE TYPE document_type AS ENUM ('cv', 'cover_letter', 'id_card', 'proposal');

-- -------------------------------------------------------------------
-- Table: users
-- -------------------------------------------------------------------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'applicant',
    applicant_type applicant_type NULL,
    institution_name VARCHAR(255) NULL,
    phone VARCHAR(255) NULL,
    email_verified_at TIMESTAMP NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------
-- Table: divisions
-- -------------------------------------------------------------------
CREATE TABLE divisions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    max_quota INTEGER NOT NULL,
    active_applicants INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------
-- Table: applications
-- -------------------------------------------------------------------
CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    division_id BIGINT NOT NULL,
    status application_status DEFAULT 'pending',
    institution_name VARCHAR(255) NULL,
    study_program VARCHAR(255) NULL,
    internship_start DATE NULL,
    internship_end DATE NULL,
    r1_passed BOOLEAN NULL,
    r3_passed BOOLEAN NULL,
    r4_passed BOOLEAN NULL,
    algorithm_score REAL NULL,
    recommended_division_id BIGINT NULL,
    rejection_reason TEXT NULL,
    admin_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_division FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_recommended FOREIGN KEY (recommended_division_id) REFERENCES divisions(id) ON DELETE SET NULL,
    UNIQUE (user_id, division_id)
);

-- -------------------------------------------------------------------
-- Table: documents
-- -------------------------------------------------------------------
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    type document_type NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    UNIQUE (application_id, type)
);

-- -------------------------------------------------------------------
-- Table: notifications
-- -------------------------------------------------------------------
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_notif_user_read ON notifications(user_id, is_read);

-- -------------------------------------------------------------------
-- Table: messages
-- -------------------------------------------------------------------
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_msg_user_created ON messages(user_id, created_at);

-- -------------------------------------------------------------------
-- Table: export_logs
-- -------------------------------------------------------------------
CREATE TABLE export_logs (
    id BIGSERIAL PRIMARY KEY,
    exported_by BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    filters JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_export_user FOREIGN KEY (exported_by) REFERENCES users(id) ON DELETE CASCADE
);

-- PostgreSQL Database Schema for AI-Powered Two-Way Calling Agent

-- Drop tables if exists (for reset scripts)
DROP TABLE IF EXISTS call_summaries CASCADE;
DROP TABLE IF EXISTS call_transcripts CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- 1. Customers Table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    company_name VARCHAR(255),
    purpose VARCHAR(255) DEFAULT 'Product enquiry',
    product VARCHAR(255) DEFAULT 'Commercial RO System',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on phone number for fast lookups
CREATE INDEX idx_customers_phone ON customers(phone_number);

-- 2. Calls Table
CREATE TABLE calls (
    id VARCHAR(100) PRIMARY KEY, -- Supports UUID or Twilio Call SID (e.g. CA123456789)
    customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
    phone_number VARCHAR(50) NOT NULL,
    direction VARCHAR(20) DEFAULT 'OUTBOUND', -- OUTBOUND / INBOUND
    status VARCHAR(50) DEFAULT 'INITIATED', -- INITIATED, RINGING, IN_PROGRESS, COMPLETED, FAILED, NO_ANSWER, DISCONNECTED, BUSY
    outcome VARCHAR(50) DEFAULT 'PENDING', -- INTERESTED, NOT_INTERESTED, FOLLOW_UP_REQUIRED, FAILED, INCOMPLETE
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INT DEFAULT 0,
    failure_reason TEXT,
    recording_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calls_customer ON calls(customer_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_outcome ON calls(outcome);
CREATE INDEX idx_calls_start_time ON calls(start_time);

-- 3. Call Transcripts Table (Turn-by-turn conversation storage)
CREATE TABLE call_transcripts (
    id SERIAL PRIMARY KEY,
    call_id VARCHAR(100) NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    speaker VARCHAR(20) NOT NULL, -- 'AI', 'CUSTOMER', 'SYSTEM'
    message TEXT NOT NULL,
    confidence DOUBLE PRECISION DEFAULT 1.0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transcripts_call_id ON call_transcripts(call_id);

-- 4. Call Summaries Table (AI-generated post-call summary & structured lead evaluation)
CREATE TABLE call_summaries (
    id SERIAL PRIMARY KEY,
    call_id VARCHAR(100) UNIQUE NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    requirement VARCHAR(255),
    capacity VARCHAR(100),
    location VARCHAR(255),
    application VARCHAR(255),
    budget VARCHAR(100),
    timeline VARCHAR(100),
    lead_status VARCHAR(50) DEFAULT 'Warm', -- Hot, Warm, Cold, Not Interested, Invalid
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    key_requirements TEXT,
    customer_intent TEXT,
    important_points TEXT,
    call_outcome TEXT,
    summary_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_summaries_lead_status ON call_summaries(lead_status);
CREATE INDEX idx_summaries_follow_up ON call_summaries(follow_up_required);

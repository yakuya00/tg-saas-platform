-- ====================================================================
-- СПРАВОЧНИКИ И ГЛОБАЛЬНЫЕ НАСТРОЙКИ
-- ====================================================================

CREATE TABLE dictionary_currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name JSONB NOT NULL
);

CREATE TABLE dictionary_gateways (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name JSONB NOT NULL
);

INSERT INTO dictionary_gateways (code, name) VALUES 
('crypto_bot', '{"ru": "Crypto Bot", "en": "Crypto Bot"}'::jsonb),
('ton_connect', '{"ru": "TON Connect", "en": "TON Connect"}'::jsonb),
('tg_stars', '{"ru": "Telegram Stars", "en": "Telegram Stars"}'::jsonb);

INSERT INTO dictionary_currencies (code, name) VALUES 
('USD', '{"ru": "Доллар США", "en": "US Dollar"}'::jsonb),
('USDT', '{"ru": "Tether", "en": "Tether"}'::jsonb),
('STARS', '{"ru": "Звезды Telegram", "en": "Telegram Stars"}'::jsonb);

-- ====================================================================
-- ПОЛЬЗОВАТЕЛИ И СИСТЕМНЫЕ ФИНАНСЫ
-- ====================================================================

CREATE TABLE users (
    tg_id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    first_name VARCHAR(255),
    language_code VARCHAR(10) DEFAULT 'ru',
    referrer_id BIGINT REFERENCES users(tg_id) ON DELETE SET NULL,
    balance_available NUMERIC(12, 4) DEFAULT 0.00,
    balance_hold NUMERIC(12, 4) DEFAULT 0.00,       
    
    is_premium_subscriber BOOLEAN DEFAULT FALSE,   
    premium_expires_at TIMESTAMPTZ,                 
    
    platform_commission NUMERIC(4, 2) DEFAULT 3.00, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE platform_finances (
    id SERIAL PRIMARY KEY,
    total_revenue_usdt NUMERIC(14, 4) DEFAULT 0.00,
    total_revenue_stars NUMERIC(14, 4) DEFAULT 0.00,
    available_to_withdraw NUMERIC(14, 4) DEFAULT 0.00, 
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_finances (id, total_revenue_usdt, total_revenue_stars, available_to_withdraw)
VALUES (1, 0.00, 0.00, 0.00);

-- ====================================================================
-- КАНАЛЫ, ВИТРИНЫ И КОМАНДНЫЙ ДОСТУП
-- ====================================================================

CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    admin_tg_id BIGINT NOT NULL REFERENCES users(tg_id) ON DELETE CASCADE,
    tg_channel_id BIGINT NOT NULL UNIQUE,
    bot_token VARCHAR(255) NULL UNIQUE, -- Токен кастомного бота админа из @BotFather
    bot_username VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    photo_url TEXT,
    
    landing_description TEXT,
    landing_banner_url TEXT,
    landing_video_note_url TEXT,
    landing_faq JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE channel_managers (
    id SERIAL PRIMARY KEY,
    channel_id INT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    manager_tg_id BIGINT NOT NULL REFERENCES users(tg_id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'operator',           -- 'owner', 'administrator', 'operator'
    permissions JSONB DEFAULT '[]'::jsonb,         -- ["view_stats", "manage_promos", "withdraw"]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, manager_tg_id)
);

-- ====================================================================
-- МАРКЕТИНГ И ТРЕКИНГ (UTM-МЕТКИ)
-- ====================================================================

CREATE TABLE marketing_links (
    id SERIAL PRIMARY KEY,
    channel_id INT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    clicks_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- СЕРВИСЫ УСЛУГ И ПРОМОКОДЫ
-- ====================================================================

CREATE TABLE platform_services (
    id SERIAL PRIMARY KEY,
    channel_id INT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL,   -- 'subscription', 'paid_chat', 'paid_post', 'donate'                 
    title VARCHAR(255) NOT NULL,
    price NUMERIC(12, 4) NOT NULL,
    currency_id INT REFERENCES dictionary_currencies(id) ON DELETE RESTRICT,
    content_data JSONB DEFAULT '{}'::jsonb,
    duration_days INT,
    
    sale_price NUMERIC(12, 4),                      
    sale_starts_at TIMESTAMPTZ,
    sale_ends_at TIMESTAMPTZ,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_channels (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL REFERENCES platform_services(id) ON DELETE CASCADE,
    channel_id INT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    UNIQUE(service_id, channel_id)
);

CREATE TABLE promo_codes (
    id SERIAL PRIMARY KEY,
    channel_id INT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'percentage',  -- 'percentage' or 'fixed'
    discount_value NUMERIC(12, 4) NOT NULL,
    usage_limit INT,
    used_count INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, code)
);

-- ====================================================================
-- АКТИВНЫЕ ПОДПИСКИ И КЛИЕНТСКАЯ АНАЛИТИКА
-- ====================================================================

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_tg_id BIGINT NOT NULL REFERENCES users(tg_id) ON DELETE CASCADE,
    service_id INT REFERENCES platform_services(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active',            -- active, expired, grace_period
    invite_link_url TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    reminded_3d BOOLEAN DEFAULT FALSE,
    reminded_1d BOOLEAN DEFAULT FALSE,
    reminded_expired_2d BOOLEAN DEFAULT FALSE
);

CREATE TABLE channel_customers (
    id SERIAL PRIMARY KEY,
    channel_id INT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_tg_id BIGINT NOT NULL REFERENCES users(tg_id) ON DELETE CASCADE,
    total_paid_usdt NUMERIC(12, 4) DEFAULT 0.00,
    payments_count INT DEFAULT 0,
    first_sub_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    is_currently_active BOOLEAN DEFAULT TRUE,
    UNIQUE(channel_id, user_tg_id)
);

-- ====================================================================
-- ФИНАНСОВЫЕ ТРАНЗАКЦИИ И РЕФЕРАЛКА
-- ====================================================================

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    service_id INT REFERENCES platform_services(id) ON DELETE SET NULL,
    subscription_id INT REFERENCES subscriptions(id) ON DELETE SET NULL,
    user_tg_id BIGINT NOT NULL REFERENCES users(tg_id),
    channel_id INT REFERENCES channels(id) ON DELETE CASCADE, 
    marketing_link_id INT REFERENCES marketing_links(id) ON DELETE SET NULL,
    
    amount NUMERIC(12, 4) NOT NULL,
    net_amount NUMERIC(12, 4) NOT NULL,
    currency_id INT REFERENCES dictionary_currencies(id) ON DELETE RESTRICT,
    gateway_id INT REFERENCES dictionary_gateways(id) ON DELETE RESTRICT,
    gateway_invoice_id VARCHAR(255) NOT NULL UNIQUE,
    telegram_payment_charge_id VARCHAR(255),
    
    customer_comment TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    available_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE withdrawal_requests (
    id SERIAL PRIMARY KEY,
    admin_tg_id BIGINT NOT NULL REFERENCES users(tg_id) ON DELETE CASCADE,
    amount NUMERIC(12, 4) NOT NULL,
    currency_id INT REFERENCES dictionary_currencies(id) ON DELETE RESTRICT,
    wallet_address TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE referral_balances (
    user_tg_id BIGINT PRIMARY KEY REFERENCES users(tg_id) ON DELETE CASCADE,
    balance_available NUMERIC(12, 4) DEFAULT 0.00,
    total_earned NUMERIC(12, 4) DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE referral_history (
    id SERIAL PRIMARY KEY,
    referrer_tg_id BIGINT NOT NULL REFERENCES users(tg_id),
    referral_tg_id BIGINT NOT NULL REFERENCES users(tg_id), 
    payment_id INT REFERENCES payments(id) ON DELETE SET NULL,
    amount NUMERIC(12, 4) NOT NULL,
    type VARCHAR(20) NOT NULL,                      -- 'user_subscription' or 'admin_turnover'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- АГРЕГИРОВАННАЯ СТАТИСТИКА, РАССЫЛКИ И РОЗЫГРЫШИ
-- ====================================================================

CREATE TABLE channel_daily_stats (
    id SERIAL PRIMARY KEY,
    channel_id INT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    earnings_usdt NUMERIC(12, 4) DEFAULT 0.00,
    earnings_stars NUMERIC(12, 4) DEFAULT 0.00,
    new_subscriptions INT DEFAULT 0,
    expired_subscriptions INT DEFAULT 0,
    renewed_subscriptions INT DEFAULT 0,
    UNIQUE(channel_id, date)
);

CREATE TABLE broadcasts (
    id SERIAL PRIMARY KEY,
    channel_id INT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    photo_url TEXT,
    run_at TIMESTAMPTZ NOT NULL,
    is_protected BOOLEAN DEFAULT FALSE, 
    target_segment VARCHAR(50) NOT NULL,            -- 'all', 'active', 'expired', 'trials'
    status VARCHAR(20) DEFAULT 'pending',           -- 'pending', 'sending', 'completed', 'failed'
    sent_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE giveaways (
    id SERIAL PRIMARY KEY,
    channel_id INT NOT NULL REFERENCES channels(id) ON DELETE CASCADE, 
    service_id INT NOT NULL REFERENCES platform_services(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL, 
    winners_count INT NOT NULL DEFAULT 1, 
    
    end_at TIMESTAMPTZ NOT NULL, 
    status VARCHAR(50) DEFAULT 'active', 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE giveaway_participants (
    id SERIAL PRIMARY KEY,
    giveaway_id INT NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
    user_tg_id BIGINT NOT NULL, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_giveaway UNIQUE(giveaway_id, user_tg_id)
);

-- ====================================================================
-- ОПТИМИЗАЦИЯ СКОРОСТИ
-- ====================================================================

CREATE INDEX idx_giveaways_end_at ON giveaways(end_at) WHERE status = 'active';
CREATE INDEX idx_broadcasts_run_at ON broadcasts(run_at) WHERE status = 'pending';
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at) WHERE status = 'active';
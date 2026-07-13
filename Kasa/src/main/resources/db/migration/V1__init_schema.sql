create table app_users (
    id bigserial primary key,
    email varchar(180) not null unique,
    password_hash varchar(255) not null,
    created_at timestamp with time zone not null
);

create table wallets (
    id bigserial primary key,
    user_id bigint not null unique references app_users(id) on delete cascade,
    fiat_balance numeric(19, 2) not null check (fiat_balance >= 0)
);

create table holdings (
    id bigserial primary key,
    user_id bigint not null references app_users(id) on delete cascade,
    symbol varchar(20) not null,
    quantity numeric(28, 10) not null check (quantity >= 0),
    constraint uk_holdings_user_symbol unique (user_id, symbol)
);

create table trade_transactions (
    id bigserial primary key,
    user_id bigint not null references app_users(id) on delete cascade,
    symbol varchar(20) not null,
    type varchar(10) not null,
    quantity numeric(28, 10) not null check (quantity > 0),
    execution_price numeric(19, 4) not null check (execution_price > 0),
    total_amount numeric(19, 2) not null check (total_amount > 0),
    created_at timestamp with time zone not null
);

create table price_snapshots (
    id bigserial primary key,
    symbol varchar(20) not null,
    pair varchar(30) not null,
    price numeric(19, 4) not null check (price > 0),
    captured_at timestamp with time zone not null
);

create index idx_trade_transactions_user_created_at
    on trade_transactions(user_id, created_at desc);

create index idx_price_snapshots_symbol_captured_at
    on price_snapshots(symbol, captured_at desc);

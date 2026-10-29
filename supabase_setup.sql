-- ===================================================================
-- CASTILLO CUP (PES 6 ONLINE) - ESQUEMA DE BASE DE DATOS EN SUPABASE
-- ===================================================================
-- Copiá y pegá este código completo en el SQL Editor de tu proyecto en https://supabase.com
-- y hacé click en el botón "RUN" (Ejecutar).

-- 1. TABLA PARA EL ESTADO OFICIAL DEL FIXTURE / TORNEO
create table if not exists tournament_state (
  id text primary key default 'official',
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABLA PARA LOS PRONÓSTICOS DEL PRODE
create table if not exists prode_submissions (
  id uuid primary key default gen_random_uuid(),
  user_name text not null,
  user_phone text not null,
  predictions jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índice único por teléfono para evitar que un mismo WhatsApp cargue más de una vez
create unique index if not exists idx_prode_user_phone on prode_submissions(user_phone);

-- 3. HABILITAR SEGURIDAD POR FILAS (Row Level Security - RLS)
alter table tournament_state enable row level security;
alter table prode_submissions enable row level security;

-- 4. POLÍTICAS DE ACCESO PARA FIXTURE (tournament_state)
-- Todos pueden ver el fixture oficial
create policy "Permitir lectura publica del fixture"
  on tournament_state for select
  using (true);

-- Permitir guardar/actualizar el fixture oficial con la anon key
create policy "Permitir actualizar fixture"
  on tournament_state for all
  using (true)
  with check (true);

-- 5. POLÍTICAS DE ACCESO PARA PRODE (prode_submissions)
-- Todos pueden ver los pronósticos cargados para calcular la tabla de posiciones en vivo
create policy "Permitir lectura publica de jugadas del prode"
  on prode_submissions for select
  using (true);

-- Cualquier participante puede insertar su jugada oficial
create policy "Permitir a participantes enviar su prode"
  on prode_submissions for insert
  with check (true);


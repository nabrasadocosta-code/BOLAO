-- =========================================================================
-- BOLÃO PIER DO COSTA - SCRIPT SQL DE CRIAÇÃO DE TABELAS (SUPABASE / POSTGRES)
-- =========================================================================
--
-- Como utilizar no Supabase:
-- 1. Acesse o painel do seu projeto no Supabase (https://supabase.com).
-- 2. Vá em "SQL Editor" no menu lateral.
-- 3. Clique em "New query" (Nova consulta).
-- 4. Cole o script abaixo e clique em "Run" (Executar).
--
-- Dica de Autenticação com PIN de 4 dígitos (Celular/PIN):
-- Como o Supabase Auth exige e-mail e senha fortes por padrão, recomendamos:
-- No seu backend/frontend, converta o celular em um e-mail falso
-- (ex: 11999999999@pierdocosta.com) e use o PIN de 4 dígitos como a senha real.
-- Isso permite usar o Supabase Auth nativamente sem SMS!

-- Habilita extensão para UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE USUÁRIOS (Perfis)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    pin VARCHAR(4) NOT NULL, -- PIN numérico de exatamente 4 dígitos
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilita RLS (Row Level Security) na tabela users se desejado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para public.users
CREATE POLICY "Permitir leitura pública de perfis básicos" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção livre de novos usuários" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização do próprio perfil" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);


-- 2. TABELA DE PARTIDAS (Mudar seleções, horários e súmula oficial)
CREATE TABLE IF NOT EXISTS public.matches (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    team_a VARCHAR(100) NOT NULL,
    team_b VARCHAR(100) NOT NULL,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Horário de início (lock de palpites)
    status VARCHAR(20) DEFAULT 'open' NOT NULL, -- 'open', 'in_progress', 'finished'
    real_results JSONB DEFAULT NULL, -- Guarda placares, craque, cartões, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT chk_status CHECK (status IN ('open', 'in_progress', 'finished'))
);

-- Políticas de acesso para public.matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de partidas" ON public.matches
    FOR SELECT USING (true);

CREATE POLICY "Apenas administradores podem modificar partidas" ON public.matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid()::text AND users.is_admin = true
        )
    );


-- 3. TABELA DE PALPITES (Bets)
CREATE TABLE IF NOT EXISTS public.bets (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    match_id TEXT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    is_paid BOOLEAN DEFAULT FALSE NOT NULL, -- Controlado pelo administrador
    
    -- Dados do Palpite (Preenchidos pelo cliente)
    placar_1t_a INTEGER DEFAULT 0 NOT NULL,
    placar_1t_b INTEGER DEFAULT 0 NOT NULL,
    placar_final_a INTEGER DEFAULT 0 NOT NULL,
    placar_final_b INTEGER DEFAULT 0 NOT NULL,
    autores_gols TEXT[] DEFAULT '{}'::TEXT[] NOT NULL, -- Array de nomes (ex: {'Neymar', 'Mitoma'})
    craque VARCHAR(150) NOT NULL,
    min_1_gol INTEGER DEFAULT 0 NOT NULL,
    escanteios_1t INTEGER DEFAULT 0 NOT NULL,
    escanteios_2t INTEGER DEFAULT 0 NOT NULL,
    cartoes_amarelos_1t INTEGER DEFAULT 0 NOT NULL,
    cartoes_vermelhos_1t INTEGER DEFAULT 0 NOT NULL,
    cartoes_amarelos_2t INTEGER DEFAULT 0 NOT NULL,
    cartoes_vermelhos_2t INTEGER DEFAULT 0 NOT NULL,
    
    -- Resultados dos pontos após processamento (calculados pelo admin)
    points_breakdown JSONB DEFAULT NULL,
    total_points INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    -- Garante que um usuário só faz 1 palpite por partida
    UNIQUE(user_id, match_id)
);

-- Políticas de acesso para public.bets
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir que usuários leiam os próprios palpites" ON public.bets
    FOR SELECT USING (true); -- No bar, palpites podem ser visíveis após fechamento para transparência

CREATE POLICY "Permitir criação/atualização de palpites pelo próprio usuário" ON public.bets
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Apenas admin pode alterar is_paid" ON public.bets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid()::text AND users.is_admin = true
        )
    );

-- Criar índices de busca para alta performance (otimizado para o ranking ao vivo)
CREATE INDEX IF NOT EXISTS idx_bets_match ON public.bets(match_id);
CREATE INDEX IF NOT EXISTS idx_bets_user ON public.bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_points ON public.bets(total_points DESC);

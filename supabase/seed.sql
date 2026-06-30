-- Dados de exemplo para desenvolvimento local (supabase start).
-- Cria 3 empreendedores (auth.users + usuarios) e seus trailers na Esplanada dos Ministérios,
-- cardápios, recompensas e avaliações de exemplo.

do $$
declare
  dono1 uuid := gen_random_uuid();
  dono2 uuid := gen_random_uuid();
  dono3 uuid := gen_random_uuid();
  trailer1 uuid := gen_random_uuid();
  trailer2 uuid := gen_random_uuid();
  trailer3 uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role)
  values
    (dono1, '00000000-0000-0000-0000-000000000000', 'trailer.executivo@camarafood.dev', crypt('senha123', gen_salt('bf')), now(), 'authenticated', 'authenticated'),
    (dono2, '00000000-0000-0000-0000-000000000000', 'trailer.natural@camarafood.dev', crypt('senha123', gen_salt('bf')), now(), 'authenticated', 'authenticated'),
    (dono3, '00000000-0000-0000-0000-000000000000', 'trailer.regional@camarafood.dev', crypt('senha123', gen_salt('bf')), now(), 'authenticated', 'authenticated');

  insert into usuarios (id, nome, email, tipo) values
    (dono1, 'Trailer Prato Certo', 'trailer.executivo@camarafood.dev', 'empreendedor'),
    (dono2, 'Trailer Verde Vida', 'trailer.natural@camarafood.dev', 'empreendedor'),
    (dono3, 'Trailer Sabor do Cerrado', 'trailer.regional@camarafood.dev', 'empreendedor');

  insert into trailers (id, nome, foto, descricao, categoria, latitude, longitude, horario_funcionamento, formas_pagamento, dono_id) values
    (trailer1, 'Prato Certo Executivo', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800', 'Marmitas executivas variadas, feitas no dia.', 'executivo', -15.7989, -47.8645, '11h às 15h, seg a sex', array['Pix','Cartão','Dinheiro'], dono1),
    (trailer2, 'Verde Vida Natural', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800', 'Saladas, sucos detox e bowls fitness.', 'natural', -15.7975, -47.8625, '10h30 às 14h30, seg a sex', array['Pix','Cartão'], dono2),
    (trailer3, 'Sabor do Cerrado', 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800', 'Comida regional brasiliense, pequi e guariroba.', 'regional', -15.8005, -47.8660, '11h às 16h, seg a sáb', array['Pix','Cartão','Dinheiro'], dono3);

  insert into cardapio_itens (trailer_id, nome, foto, descricao, preco, categoria, disponivel) values
    (trailer1, 'Marmita Frango Grelhado', 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600', 'Frango grelhado, arroz, feijão, legumes.', 22.90, 'executivo', true),
    (trailer1, 'Marmita Carne de Panela', 'https://images.unsplash.com/photo-1606850780554-b55ea4dd0b70?w=600', 'Carne de panela com mandioca e couve.', 24.90, 'executivo', true),
    (trailer2, 'Bowl Fitness Quinoa', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', 'Quinoa, grão de bico, legumes assados.', 26.50, 'natural', true),
    (trailer2, 'Suco Detox Verde', 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600', 'Couve, limão, gengibre e maçã.', 11.00, 'bebidas', true),
    (trailer3, 'Galinhada com Pequi', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600', 'Galinhada caseira com pequi do cerrado.', 28.00, 'regional', true),
    (trailer3, 'Pamonha Doce', 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600', 'Pamonha tradicional feita na hora.', 9.50, 'sobremesas', true);

  insert into recompensas (nome, descricao, selos_necessarios, tipo, valor, trailer_id) values
    ('10% de desconto', 'Desconto na próxima marmita.', 10, 'desconto', '10%', trailer1),
    ('Suco grátis', 'Um suco detox por sua conta.', 10, 'brinde', 'Suco Detox Verde', trailer2),
    ('Pamonha grátis', 'Uma pamonha doce de cortesia.', 10, 'brinde', 'Pamonha Doce', trailer3);
end $$;

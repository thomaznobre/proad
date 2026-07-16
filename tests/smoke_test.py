import pathlib

root = pathlib.Path(__file__).resolve().parents[1]
index = (root / 'index.html').read_text(encoding='utf-8')
app_js = (root / 'app.js').read_text(encoding='utf-8')
assert 'Proad — Protocolo e Tramitação Processual' in index
assert 'Painel Geral' in index
assert 'Licitações' in index
assert 'app.js' in index
assert 'fornecedores' in app_js
assert 'LIDER LOGISTICA ALIMENTAR E DISTRIBUICAO LTDA' in app_js
assert 'SEJA + EDUCAÇÃO E CULTURA LTDA' in app_js
assert 'Aditivo' in app_js
assert 'Apostilamento' in app_js
assert 'Data de início' in app_js
assert 'parentSelect' in app_js
assert 'Fundo' in app_js
print('Smoke test passed')

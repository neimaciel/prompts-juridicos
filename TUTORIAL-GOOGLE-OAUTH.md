# 🔧 TUTORIAL: Como Resolver o Erro Google OAuth

## O QUE ESTÁ ACONTECENDO
O Google está rejeitando o login porque o **URI de redirecionamento** não está configurado no Google Cloud Console.

## SOLUÇÃO EM 4 PASSOS SIMPLES

### PASSO 1: Acesse o Google Cloud Console
```
🌐 https://console.cloud.google.com/
```
- Entre com a mesma conta Google que você usou para criar as chaves OAuth

### PASSO 2: Vá para Credentials
```
📍 Menu lateral → APIs & Services → Credentials
```
- Procure por "OAuth 2.0 Client IDs"
- Clique no NOME da sua credencial (não no ícone de editar)

### PASSO 3: Adicione o URI Correto
Na seção **"Authorized redirect URIs"**:

1. **COPIE este URI exato:**
```
https://promptsjuridicos.com.br/api/auth/google/callback
```

**IMPORTANTE: Adicione EXATAMENTE este URI que está no erro:**
```
https://276431e6-150d-4535-93de-a0596541ade1-00-1kqp6bg32sbhj.spock.replit.dev/api/auth/google/callback
```

2. **COLE** na caixa de "Authorized redirect URIs"

3. **REMOVA** qualquer URI antigo que esteja lá

4. **CLIQUE "SAVE"** (botão azul)

### PASSO 4: Teste Novamente
- Aguarde 2-3 minutos
- Volte ao app
- Clique "Criar conta com Google"
- Agora deve funcionar!

## ⚠️ IMPORTANTE
- Use exatamente o URI que copiei acima
- Não modifique nada no URI
- Certifique-se de salvar no Google Cloud Console

## 🎯 RESULTADO ESPERADO
Após configurar corretamente, o botão "Criar conta com Google" irá:
1. Redirecionar para o Google
2. Permitir login/autorização
3. Voltar para o app com o usuário logado
4. Dar 1700 tokens automaticamente
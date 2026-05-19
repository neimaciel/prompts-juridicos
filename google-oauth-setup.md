# Configuração Google OAuth - Instruções ATUALIZADAS

## ❌ ERRO redirect_uri_mismatch DETECTADO - SOLUÇÃO IMEDIATA

O erro "redirect_uri_mismatch" indica que o **Authorized redirect URI** no Google Cloud Console não está configurado corretamente. Vou resolver isso agora!

## ✅ SOLUÇÃO - Configure no Google Cloud Console:

### 1. Acesse o Google Cloud Console
- Vá para: https://console.cloud.google.com/
- Selecione seu projeto ou crie um novo

### 2. Configure OAuth 2.0
- Navegue: **APIs & Services** → **Credentials**
- Clique em sua **OAuth 2.0 Client ID** existente (ou crie uma nova)

### 3. IMPORTANTE - Configure o Redirect URI EXATO:
Na seção **"Authorized redirect URIs"**, adicione EXATAMENTE este URI:

```
https://276431e6-150d-4535-93de-a0596541ade1-00-1kqp6bg32sbhj.spock.replit.dev/api/auth/google/callback
```

**❌ ERRO ATUAL DETECTADO:** O URI no Google Cloud Console não confere exatamente com o configurado no sistema.

**✅ SOLUÇÃO:** 
1. Copie o URI acima EXATAMENTE (com https://)
2. Cole na seção "Authorized redirect URIs" 
3. Remova qualquer URI incorreto que esteja lá
4. **CERTIFIQUE-SE:** O URI deve estar EXATAMENTE como mostrado, incluindo:
   - `https://` (não http://)
   - O domínio Replit completo
   - `/api/auth/google/callback` no final
5. Salve as alterações

### 4. Salve as Alterações
- Clique **"Save"** no Google Cloud Console
- Aguarde alguns minutos para propagação

### 5. Teste Novamente
- Clique no botão **"Criar conta com Google"**
- Agora deve redirecionar corretamente

## 🔄 Se Ainda Houver Erro:
1. Verifique se copiou o URI exatamente como mostrado acima
2. Aguarde 5-10 minutos após salvar (cache do Google)
3. Tente em uma aba anônima/privada

## ✅ URI Correto Configurado no Sistema:
- ✅ Backend: Configurado para o domínio Replit correto
- ✅ Chaves: GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET ativas
- ✅ Passport: Estratégia Google OAuth implementada
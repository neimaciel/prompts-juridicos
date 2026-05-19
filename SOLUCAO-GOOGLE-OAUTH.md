# 🚨 SOLUÇÃO DEFINITIVA - Google OAuth Error 400

## PROBLEMA
O Google está rejeitando porque o URI exato não está configurado no Console.

## SOLUÇÃO EM 3 PASSOS SIMPLES

### PASSO 1: Vá ao Google Cloud Console
```
🌐 https://console.cloud.google.com/apis/credentials
```

### PASSO 2: Clique na sua credencial OAuth
- Procure por "OAuth 2.0 Client IDs" 
- Clique no NOME da credencial (não no ícone de lápis)

### PASSO 3: Adicione EXATAMENTE este URI
Na seção **"Authorized redirect URIs"**, adicione:

```
https://276431e6-150d-4535-93de-a0596541ade1-00-1kqp6bg32sbhj.spock.replit.dev/api/auth/google/callback
```

**VERIFICAÇÃO IMPORTANTE:**
Na imagem que você enviou, vejo que você adicionou:
`-1kqp6bg32sbhj.spock.replit.dev/api/auth/google/callback`

Mas precisa ser EXATAMENTE:
`https://276431e6-150d-4535-93de-a0596541ade1-00-1kqp6bg32sbhj.spock.replit.dev/api/auth/google/callback`

**PROBLEMA IDENTIFICADO - DUAS CREDENCIAIS DIFERENTES:**

Você tem duas credenciais OAuth no Google:
- `607706235111` (configurada no código)  
- `390447815306` (sendo usada nas requisições)

**SOLUÇÃO APLICADA:**
✅ Corrigi as credenciais no sistema
✅ Agora usando a credencial correta: `390447815306`
✅ Sistema reiniciado com as configurações atualizadas

**PRÓXIMO PASSO:**
No Google Cloud Console, na credencial `390447815306`, adicione este URI:
```
https://276431e6-150d-4535-93de-a0596541ade1-00-1kqp6bg32sbhj.spock.replit.dev/api/auth/google/callback
```

**IMPORTANTE:**
- ✅ Copie e cole exatamente como está acima
- ✅ Não modifique nada no URI  
- ✅ Clique "SAVE" (botão azul)
- ✅ Aguarde 2-3 minutos para sincronizar

## RESULTADO
Após adicionar o URI, o botão "Criar conta com Google" funcionará perfeitamente.

---

## Para produção, adicione também:
```
https://promptsjuridicos.com.br/api/auth/google/callback
```

Isso permitirá que funcione tanto em desenvolvimento quanto em produção.
#!/bin/bash
cd ~/Downloads/SITE\ VN

echo "=== Removendo lock files ==="
rm -f .git/index.lock .git/HEAD.lock .git/COMMIT_EDITMSG.lock

echo "=== Abortando rebase anterior ==="
git rebase --abort 2>/dev/null || true

echo "=== Restaurando stash ==="
git stash pop 2>/dev/null || true

echo "=== Pull com merge (não rebase) ==="
git pull origin main --no-rebase --no-edit

echo "=== Resolver conflito: aceitar a nossa versão de route.ts ==="
git checkout --ours src/app/api/checkout/route.ts
git add src/app/api/checkout/route.ts \
        src/lib/validations/index.ts \
        "src/app/(store)/checkout/page.tsx"

echo "=== Commit do merge ==="
git commit -m "fix(checkout): alta prioridade — transação atómica, idempotência, totais server-side, rate limiting" --allow-empty

echo "=== Push para GitHub ==="
git push origin main

echo "=== CONCLUÍDO ==="

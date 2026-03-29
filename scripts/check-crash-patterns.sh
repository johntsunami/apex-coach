#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# APEX Coach — Pre-commit crash pattern detector
# Catches common blank-screen bugs before they ship
# Run: bash scripts/check-crash-patterns.sh
# ═══════════════════════════════════════════════════════════════

echo "🔍 Checking for crash-causing patterns..."
ERRORS=0

# 1. Check for bare 'profile' references outside AppInner/useAuth destructuring
echo "  Checking bare 'profile' references..."
# Find lines with profile?. or profile. that aren't inside useAuth destructuring
BARE_PROFILE=$(grep -rn "const userName.*=.*profile\?\.first_name" src/App.jsx | grep -v "auth\?\." | grep -v "const.*{.*profile.*}.*=.*useAuth")
if [ -n "$BARE_PROFILE" ]; then
  echo "  ❌ BARE PROFILE: Found 'profile' used without being in scope:"
  echo "  $BARE_PROFILE"
  ERRORS=$((ERRORS + 1))
fi

# 2. Check for .map() without || [] guard on dynamic data
echo "  Checking unsafe .map() calls..."
UNSAFE_MAP=$(grep -rn "getSessions()\.map\|getInjuries()\.map\|getStats()\.map" src/ --include="*.js" --include="*.jsx" | grep -v "|| \[\]")
if [ -n "$UNSAFE_MAP" ]; then
  echo "  ⚠️  UNSAFE MAP: .map() called on function return without || [] guard:"
  echo "  $UNSAFE_MAP"
  ERRORS=$((ERRORS + 1))
fi

# 3. Check for .then() without .catch() on supabase calls
echo "  Checking unhandled promises..."
UNHANDLED=$(grep -rn "supabase\." src/ --include="*.js" --include="*.jsx" | grep "\.then(" | grep -v "\.catch\|\.then(() => {})")
if [ -n "$UNHANDLED" ]; then
  echo "  ⚠️  UNHANDLED PROMISE: Supabase call without .catch():"
  echo "  $UNHANDLED"
fi

# 4. Check for undefined variable references (common patterns)
echo "  Checking for common undefined patterns..."
UNDEF=$(grep -rn "=auth\?\.profile\?\." src/App.jsx | grep -v "const auth=useAuth")
if [ -n "$UNDEF" ]; then
  echo "  ⚠️  Check auth.profile access is in correct scope"
fi

if [ $ERRORS -eq 0 ]; then
  echo "✅ No crash patterns detected"
else
  echo "❌ Found $ERRORS critical issue(s) — fix before committing"
  exit 1
fi

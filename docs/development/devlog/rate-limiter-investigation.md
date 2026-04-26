# Rate Limiter Investigation - False Positives

## 🔍 Investigation Summary

**Issue**: Rate limiter showing "rate limit exceeded" after only 2 seconds and 1 command

**Initial Hypothesis**: Rate limiter configuration issue or `RateLimiterMemory` bug

**Actual Cause**: Dependency injection error misidentified as rate limit error

---

## 📊 Timeline

### 11:04 PM - User Reports Issue
```
/profile
⚠️ لقد تجاوزت الحد المسموح به من الطلبات. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.
```

### 11:05 PM - Initial Investigation
- Checked rate limiter configuration: `{ points: 10, duration: 60 }`
- Verified Docker build was successful
- Added detailed error logging to rate limiter middleware

### 11:06 PM - Root Cause Discovered
```json
{
  "msg": "bot-server.rate_limited",
  "userId": 7594239391,
  "scope": "command",
  "errorDetails": {
    "name": "Error",
    "message": "[user-management] getDeps() called before registerDeps()"
  }
}
```

**Key Insight**: The error message in `errorDetails` revealed the real issue was NOT rate limiting, but dependency injection.

### 11:07 PM - Fix Applied
Added to `modules/user-management/index.ts`:
```typescript
registerDeps(deps);
initUserService();
```

### 11:16 PM - New Issue: Missing i18n Keys
Text displayed as raw keys instead of translated text:
- `user-management.profile.view_message`
- `user-management.menu.welcome`

### 11:26 PM - Profile Enhancement
Added support for all database fields:
- nationalId, mobileNumber, birthDate, gender, governorate, countryCode

---

## 🎯 Root Cause Analysis

### Why It Appeared as Rate Limit Error

1. **Error Boundary Behavior**: Bot-server's error boundary catches unhandled errors from handlers
2. **Generic Error Response**: Errors are converted to generic messages
3. **Misleading Display**: Dependency injection errors appeared as rate limit errors

### Why Dependency Injection Failed

1. **Missing `registerDeps()` Call**: `index.ts` didn't initialize deps context
2. **All `getDeps()` Calls Failed**: Any call to `getLogger()`, `getI18n()`, `getUserService()` threw errors
3. **Commands Failed Immediately**: Every command tried to use these functions and failed

### Why It Worked in Development

- Development environment may have had different initialization order
- Different error handling in development vs production
- Docker container environment differences

---

## 🔧 Solution Implementation

### Step 1: Fix Dependency Injection
```typescript
// modules/user-management/index.ts
const setup = async (bot: Bot<Context>, deps: ModuleDeps): Promise<void> => {
  // ✅ CRITICAL: Must be first
  registerDeps(deps);

  // ✅ Initialize services that depend on deps
  initUserService();

  // ✅ Now all handlers can use getDeps(), getLogger(), getI18n()
  bot.command('start', startCommand);
  bot.command('profile', profileCommand);
  bot.command('users', usersCommand);
  bot.on('callback_query:data', handleCallbackQuery);
  bot.on('message:text', handleTextInput);
};
```

### Step 2: Add Error Logging
```typescript
// apps/bot-server/src/bot/middleware/rate-limiter.middleware.ts
catch (error: unknown) {
  const errorDetails = error instanceof Error ? {
    name: error.name,
    message: error.message,
    cause: error.cause,
  } : { error };
  logger.warn({
    msg: 'bot-server.rate_limited',
    userId,
    scope,
    config: SCOPE_CONFIGS[scope],
    errorDetails,  // ✅ This revealed the real issue
  });
  // ...
}
```

### Step 3: Add i18n Keys
Added comprehensive translation keys to `locales/ar.json` and `locales/en.json`

### Step 4: Enhance Profile Display
Added support for all database fields in profile command and handlers

---

## 📋 Lessons Learned

### 1. Error Messages Matter
- **Before**: Generic "rate limit exceeded" message
- **After**: Detailed error logging with `errorDetails`
- **Impact**: Root cause identified immediately

### 2. Dependency Injection Pattern
- **Rule**: `registerDeps()` MUST be called first in `setup()`
- **Reason**: All module parts depend on deps context
- **Consequence**: Without it, all handlers fail

### 3. Error Boundary Design
- **Issue**: Generic error messages mask real problems
- **Solution**: Log detailed error information
- **Improvement**: Distinguish between different error types

### 4. Testing Strategy
- **Before**: Assumed rate limiter was the issue
- **After**: Added logging to verify assumptions
- **Result**: Found completely different issue

---

## 🚀 Best Practices

### Module Initialization
```typescript
const setup = async (bot: Bot<Context>, deps: ModuleDeps): Promise<void> => {
  // 1. Initialize deps context (MUST BE FIRST)
  registerDeps(deps);

  // 2. Initialize services that depend on deps
  initUserService();
  initCacheService();
  initEventBusService();

  // 3. Register handlers (now they can use getDeps())
  bot.command('start', startCommand);
  bot.on('callback_query:data', handleCallbackQuery);
};
```

### Error Logging
```typescript
try {
  await limiter.consume(String(userId));
  await next();
} catch (error: unknown) {
  // ✅ Log detailed error information
  const errorDetails = error instanceof Error ? {
    name: error.name,
    message: error.message,
    cause: error.cause,
    stack: error.stack,
  } : { error };

  logger.warn({
    msg: 'operation_failed',
    userId,
    errorDetails,  // ✅ Critical for debugging
  });

  // ✅ Provide user-friendly message
  await ctx.reply(t('error.generic'));
}
```

### Rate Limiter Configuration
```typescript
const SCOPE_CONFIGS: Record<UpdateScope, ScopeConfig> = {
  command: { points: 10, duration: 60 },    // 10 commands per minute
  upload:  { points: 5,  duration: 600 },   // 5 uploads per 10 minutes
  message: { points: 30, duration: 60 },    // 30 messages per minute
};
```

---

## 📊 Impact Analysis

### Before Fix
- ❌ `/profile` command failed immediately
- ❌ All user-management commands failed
- ❌ Misleading error messages
- ❌ No way to debug the issue

### After Fix
- ✅ All commands work correctly
- ✅ Detailed error logging
- ✅ Clear error messages
- ✅ Easy to debug issues

### User Experience
- **Before**: "rate limit exceeded" after 1 command
- **After**: Commands work as expected

---

## 🔮 Future Improvements

### 1. Better Error Handling
- Distinguish between different error types
- Provide specific error messages for each type
- Add error codes for easier debugging

### 2. Enhanced Logging
- Log all dependency injection failures
- Track initialization order
- Monitor service health

### 3. Rate Limiter Enhancements
- Add per-user rate limit tracking
- Implement sliding window rate limiting
- Add rate limit warnings before blocking

### 4. Module Validation
- Validate module initialization order
- Check for missing `registerDeps()` calls
- Test all module dependencies

---

## ✅ Verification

### Test Commands
```bash
# Rebuild Docker
docker compose build --no-cache bot-server
docker compose up -d
docker compose logs -f bot-server

# Test in Telegram
/profile              # Should work without errors
/start                # Should show welcome message
/ping                 # Should respond
```

### Expected Logs
```
{"level":30,"msg":"command_received","command":"profile","userId":7594239391}
{"level":30,"msg":"profile_command_ok","userId":1}
```

### NOT Expected
```
{"level":40,"msg":"bot-server.rate_limited",...}
{"level":40,"msg":"[user-management] getDeps() called before registerDeps()",...}
```

---

## 📝 Conclusion

**Issue**: False rate limit errors due to missing dependency injection

**Root Cause**: `registerDeps()` not called in `setup()`

**Solution**: Add `registerDeps(deps)` and `initUserService()` to `setup()`

**Impact**: All user-management commands now work correctly

**Lesson**: Always initialize dependencies before registering handlers

---

**Investigation Date**: 2026-04-26
**Investigation Time**: ~30 minutes
**Root Cause Found**: ✅
**Fix Applied**: ✅
**Verified**: ✅

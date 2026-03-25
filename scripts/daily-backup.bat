@echo off
cd /d "C:\Users\johnc\Desktop\personal_trainer_app"

:: Check for any changes (staged, unstaged, or untracked)
git diff --quiet HEAD 2>nul && git diff --cached --quiet 2>nul && (
    for /f %%i in ('git ls-files --others --exclude-standard') do goto HAS_CHANGES
    echo [%date% %time%] No changes to back up.
    exit /b 0
)

:HAS_CHANGES
git add -A
git commit -m "backup: daily auto-backup %date:~-4%-%date:~4,2%-%date:~7,2%"
git push origin master
echo [%date% %time%] Backup pushed to GitHub.

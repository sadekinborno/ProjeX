@echo off
:: ProjeX Development Environment Launcher
:: This script activates the Python virtual environment, launches the Tailwind CSS watcher,
:: and runs the Django REST Framework development server.

:: Ensure the command context is the batch directory
cd /d "%~dp0"

title ProjeX Development Suite

echo ========================================================
echo                  PROJEX LAUNCHER
echo ========================================================
echo.

:: ----------------------------------------------------------
:: Check Node modules & Tailwind CSS
:: ----------------------------------------------------------
echo [1/3] Checking Frontend Dependencies...
if not exist "node_modules\" (
    echo [WARN] node_modules folder is missing. Installing tailwindcss and dev dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to run 'npm install'. Please ensure Node.js is installed.
        goto :error
    )
) else (
    echo [OK] Frontend dependencies detected.
)
echo.

:: ----------------------------------------------------------
:: Start Tailwind CSS Watcher in a separate window
:: ----------------------------------------------------------
echo [2/3] Launching Tailwind CSS Watcher...
echo [INFO] A new window will open to watch and compile styles.
start "ProjeX - Tailwind CSS Watcher" cmd /c "npm run dev"
echo.

:: ----------------------------------------------------------
:: Check Virtual Environment & Activate
:: ----------------------------------------------------------
echo [3/3] Launching Django Backend Server...
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment 'venv' was not found!
    echo Please create the virtual environment first by running:
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    goto :error
)

echo [INFO] Activating Python virtual environment (venv)...
call venv\Scripts\activate.bat

:: Make sure MySQL is running reminder
echo [INFO] Note: Ensure your MySQL database server is running.

:: Automatic DB migration check/update.
echo [INFO] Checking for database migrations...
python manage.py migrate
if %ERRORLEVEL% neq 0 (
    echo [WARN] Database migrations or connection failed.
    echo [WARN] Please make sure your MySQL server is running and database configuration is correct.
    echo [WARN] Continuing execution anyway...
)
echo.

echo ========================================================
echo  SUCCESS: Services starting up!
echo  - Frontend: http://127.0.0.1:8000/
echo  - API:      http://127.0.0.1:8000/api/
echo  - Admin:    http://127.0.0.1:8000/admin/
echo ========================================================
echo.
echo Starting Django development server (Press Ctrl+C to terminate)...
python manage.py runserver
goto :end

:error
echo.
echo ========================================================
echo  ERROR: Startup failed. Please resolve the errors above.
echo ========================================================
pause

:end

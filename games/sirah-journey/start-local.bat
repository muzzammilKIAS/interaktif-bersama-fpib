@echo off
setlocal
cd /d "%~dp0"
py -3 -c "import sys; assert sys.version_info.major == 3" >nul 2>&1
if not errorlevel 1 (
  py -3 serve.py
  pause
  exit /b
)
python -c "import sys; assert sys.version_info.major == 3" >nul 2>&1
if not errorlevel 1 (
  python serve.py
  pause
  exit /b
)
echo Python 3 diperlukan untuk memulakan server tempatan.
echo Pasang Python 3 dari https://www.python.org/downloads/
echo Tandakan Add Python to PATH semasa pemasangan, kemudian cuba semula.
pause

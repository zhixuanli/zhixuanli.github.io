@echo off
setlocal
cd /d "%~dp0.."

set "RUBY_EXE=%USERPROFILE%\Ruby27-x64\bin\ruby.exe"
if not exist "%RUBY_EXE%" set "RUBY_EXE=ruby"

"%RUBY_EXE%" scripts\jekyll_windows_compat.rb serve --host 127.0.0.1 --port 4000 %*

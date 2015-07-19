@echo off
setlocal enabledelayedexpansion enableextensions
set LIST=
for /f "delims=" %%x in ('forfiles /s /m *.js /c "cmd /c echo @relpath"') do (
set LIST=!LIST! %%x
)

set LIST=%LIST:~1%

docco %LIST%
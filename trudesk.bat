@echo off

rem %1 action
rem %2 subaction

setlocal enabledelayedexpansion
2>nul call :CASE_%1
if ERRORLEVEL 1 call :DEFAULT_CASE

exit /B

:CASE_start
    echo Starting TruDesk
    echo   "trudesk.bat stop" to stop the TruDesk server
    echo   "trudesk.bat log" to view server output

    rem Start the loader daemon
    node runner %*

    goto END_CASE

:CASE_stop
    call :pidexists
    if %_result%==0 (
        echo TruDesk is already stopped.
    ) else (
        echo Stopping TruDesk. Done!

        taskkill /PID !_pid! /f>nul
    )

    goto END_CASE

:CASE_restart
    echo Unsupported

    goto END_CASE

:CASE_reload
    echo Unsupported

    goto END_CASE

:CASE_status
    call :pidexists
    if %_result%==0 (
        echo TruDesk is not running
        echo   "trudesk.bat start" to launch the TruDesk server
    ) else (
        echo TruDesk Running ^(pid !_pid!^)
        echo   "trudesk.bat stop" to stop the TruDesk server
        echo   "trudesk.bat log" to view server output
        echo   "trudesk.bat restart" to restart NodeBB
    )

    goto END_CASE

:CASE_log
    cls
    type .\logs\app.log

    goto END_CASE

:CASE_upgrade
    call npm install
    node app --upgrade
    copy /b package.json +,,>nul

    goto END_CASE

:CASE_setup
    node app --setup %*

    goto END_CASE

:CASE_reset
    node app --reset --%2

    goto END_CASE

:CASE_dev
    echo Launching TruDesk in "development" mode.
    set NODE_ENV=development
    node runner --no-daemon %*

    goto END_CASE

:DEFAULT_CASE
    echo Welcome to TruDesk
    echo Usage: trudesk.bat ^{start^|stop^|log^|setup^|reset^|upgrade^|dev^}

    goto END_CASE

:END_CASE
    endlocal
    VER > NUL
    goto :EOF

:pidexists
if exist pidfile (
    set /p _pid=<pidfile

    for /f "usebackq" %%Z in (`tasklist /nh /fi "PID eq !_pid!"`) do (
        if %%Z==INFO: (
            del pidfile
            set _result=0
        ) else (
            set _result=1
        )
    )
) else (
    set _result=0
)
@echo off
set file="ui.min.js"

call uglifyjs utils.js arrayLike.js ajax.js templating.js ui.js -c -m --toplevel --warn -o %file%

REM uglify(uglify(x)) != uglify(x) in some situations, so by looping uglify calls we ensure the lowest possible file size
set size=0
FOR /F "usebackq" %%A IN ('%file%') DO set size=%%~zA
echo %size%
:begin
	echo Minified to %size% bytes
	set oldSize=%size%
	call uglifyjs %file% -c -m --toplevel --warn -o %file%
	set size=0
	FOR /F "usebackq" %%A IN ('%file%') DO set size=%%~zA
	if NOT %size%==%oldSize% goto begin




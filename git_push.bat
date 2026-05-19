@echo off
set GIT=C:\Users\alesa\AppData\Local\GitHubDesktop\app-3.5.8\resources\app\git\cmd\git.exe
"%GIT%" add -A
"%GIT%" commit -m "fix: generate real PNG icons, add manifest id, fix screenshot sizes (1280x720 wide, 540x960 narrow)"
"%GIT%" push
echo Done.

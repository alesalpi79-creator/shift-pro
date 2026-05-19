@echo off
set GIT=C:\Users\alesa\AppData\Local\GitHubDesktop\app-3.5.8\resources\app\git\cmd\git.exe
"%GIT%" add -A
"%GIT%" commit -m "fix: PWA manifest - split icon purposes, add orientation, screenshots and service worker"
"%GIT%" push
echo Done.

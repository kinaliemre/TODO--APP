Option Explicit

Dim fso, shell, scriptDir, psPath, cmd
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
psPath = fso.BuildPath(scriptDir, "start-hidden.ps1")

cmd = "powershell -NoProfile -ExecutionPolicy Bypass -File """ & psPath & """"
shell.Run cmd, 0, False

using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace ToDoListLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                
                string[] candidates = new string[]
                {
                    Path.Combine(baseDir, "release", "ToDoList-win32-x64", "ToDoList.exe"),
                    Path.Combine(baseDir, "ToDoList-win32-x64", "ToDoList.exe"),
                    Path.Combine(baseDir, "..", "..", "release", "ToDoList-win32-x64", "ToDoList.exe"),
                    Path.Combine(baseDir, "..", "release", "ToDoList-win32-x64", "ToDoList.exe"),
                    Path.Combine(baseDir, "dist", "win-unpacked", "To-Do List.exe"),
                    Path.Combine(baseDir, "..", "..", "dist", "win-unpacked", "To-Do List.exe"),
                    Path.Combine(baseDir, "..", "dist", "win-unpacked", "To-Do List.exe")
                };

                foreach (string candidate in candidates)
                {
                    string fullPath = Path.GetFullPath(candidate);
                    if (File.Exists(fullPath))
                    {
                        ProcessStartInfo psi = new ProcessStartInfo(fullPath);
                        psi.WorkingDirectory = Path.GetDirectoryName(fullPath);
                        Process.Start(psi);
                        return;
                    }
                }

                string[] electronCandidates = new string[]
                {
                    Path.Combine(baseDir, "node_modules", "electron", "dist", "electron.exe"),
                    Path.Combine(baseDir, "..", "..", "node_modules", "electron", "dist", "electron.exe"),
                    Path.Combine(baseDir, "..", "node_modules", "electron", "dist", "electron.exe")
                };

                foreach (string ec in electronCandidates)
                {
                    string fullEc = Path.GetFullPath(ec);
                    if (File.Exists(fullEc))
                    {
                        string appDir = File.Exists(Path.Combine(baseDir, "package.json")) ? baseDir : Path.GetFullPath(Path.Combine(baseDir, "..", ".."));
                        ProcessStartInfo psi = new ProcessStartInfo(fullEc, ".");
                        psi.WorkingDirectory = appDir;
                        Process.Start(psi);
                        return;
                    }
                }

                MessageBox.Show("Fichier exécutable To-Do List introuvable.", "Erreur - To-Do List", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erreur lors du lancement : " + ex.Message, "To-Do List", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}

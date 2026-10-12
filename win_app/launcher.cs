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
                string exePath = Path.Combine(baseDir, "release", "ToDoList-win32-x64", "ToDoList.exe");
                
                if (File.Exists(exePath))
                {
                    ProcessStartInfo psi = new ProcessStartInfo(exePath);
                    psi.WorkingDirectory = Path.GetDirectoryName(exePath);
                    Process.Start(psi);
                    return;
                }

                string nodeElectron = Path.Combine(baseDir, "node_modules", "electron", "dist", "electron.exe");
                if (File.Exists(nodeElectron))
                {
                    ProcessStartInfo psi = new ProcessStartInfo(nodeElectron, ".");
                    psi.WorkingDirectory = baseDir;
                    Process.Start(psi);
                    return;
                }

                MessageBox.Show("Fichier exécutable introuvable dans release\\ToDoList-win32-x64\\ToDoList.exe", "Erreur - To-Do List", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erreur lors du lancement : " + ex.Message, "To-Do List", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}

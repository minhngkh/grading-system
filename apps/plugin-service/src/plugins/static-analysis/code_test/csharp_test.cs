using System;

class Program {
    static void Main() {
        // Test for no-debugger
        System.Diagnostics.Debugger.Break();
        
        // Test for empty-catch
        try {
            int x = 1 / 0;
        } catch (Exception) {
        }
        
        // Test for hardcoded-password
        string password = "secret";
    }
} 
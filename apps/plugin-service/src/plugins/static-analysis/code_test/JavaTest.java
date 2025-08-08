public class JavaTest {
    public static void main(String[] args) {
        // Test for no-debugger
        debugger;
        
        // Test for empty-catch
        try {
            int x = 1 / 0;
        } catch (Exception e) {
        }
        
        // Test for hardcoded-password
        String password = "secret";
    }
} 
#include <stdio.h>
#include <stdlib.h>

int main() {
    // Test for no-system
    system("ls");
    
    // Test for gets-usage
    char buffer[100];
    gets(buffer);
    
    // Test for hardcoded-password
    char *password = "secret";
    return 0;
} 
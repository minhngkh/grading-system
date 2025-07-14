#include <iostream>
#include <cstdlib>
#include <string>

int main() {
    // Test for no-system
    system("ls");
    
    // Test for gets-usage
    char buffer[100];
    gets(buffer);
    
    // Test for hardcoded-password
    std::string password = "secret";
    return 0;
} 
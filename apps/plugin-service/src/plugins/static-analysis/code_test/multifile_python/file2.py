# file2.py
from file1 import get_password

def main():
    pw = get_password()
    print("Password is:", pw)  # print instead of logging (should trigger rule)

if __name__ == "__main__":
    main() 
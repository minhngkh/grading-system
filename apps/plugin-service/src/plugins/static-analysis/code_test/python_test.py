# Test for no-logging-debug
import logging
logging.debug("This is a debug message")

# Test for hardcoded-password
password = "password"

# Test for none-dereference
def foo(x):
    if x is None:
        print("x is None")
    x.attr 
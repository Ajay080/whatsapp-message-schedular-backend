import sys
import os
from twilio.rest import Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def send_message(to, message):
    # Retrieve environment variables
    account_sid = os.getenv('SID')
    auth_token = os.getenv('TOKEN')
    from_number = os.getenv('FROM_NUMBER')

    print("ac",os.getenv('SID'), os.getenv('TOKEN'), os.getenv('FROM_NUMBER'))
    
    client = Client(account_sid, auth_token)
    
    message = client.messages.create(
        body=message,
        from_=from_number,
        to=f'whatsapp:{to}'
    )
    
    print(f"Message sent to {to}: {message.sid}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python send_message.py <phone_number> <message>")
        sys.exit(1)
    
    phone = sys.argv[1]
    message = sys.argv[2]
    send_message(phone, message)

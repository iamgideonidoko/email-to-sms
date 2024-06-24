# Create mailing list
curl -s --user 'api:<YOUR_API_KEY>' \
    https://api.mailgun.net/v3/lists \
    -F address='demo_list@<YOUR_DOMAIN>' \
    -F name='Demo list' \
    -F description='This is a demo mailing list' \
    -F reply_preference=sender

# Add users to mailing list
curl -s --user 'api:<YOUR_API_KEY>' \
    https://api.mailgun.net/v3/lists/demo_list@<YOUR_DOMAIN>/members.json \
    -F members='[{"name": "John Doe", "address": "johndoe@example.com", "subscribed": true, "vars": { "phone": "+14XXXXX", "list": "demo_list" }}]'

# Create webhook for opened events
curl -s --user 'api:<YOUR_API_KEY>' \
    https://api.mailgun.net/v3/domains/<YOUR_DOMAIN>/webhooks \
    -F id='opened' \
    -F url='https://XXXXXX'

# Send email to mailing list recipients
curl -s --user 'api:<YOUR_API_KEY>' \
    https://api.mailgun.net/v3/<YOUR_DOMAIN>/messages \
    -F from='postmaster@<YOUR_DOMAIN>' \
    -F to='demo_list@<YOUR_DOMAIN>' \
    -F subject='Hello there!' \
    -F text="We've got the following special offers lined up for you: ..."

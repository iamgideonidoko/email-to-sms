# Create webhook for delivered events
curl -s --user 'api:<YOUR_API_KEY>' \
    https://api.mailgun.net/v3/domains/<YOUR_DOMAIN>/webhooks \
    -F id='delivered' \
    -F url='https://XXXXXX'

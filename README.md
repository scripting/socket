## socket

A layer on top of WebSockets for Node-based servers. 

### What is?

I found I was cribbing this code every time I wanted to create a WebSockets server in Node.

Much better to factor it out, so that next time it's easier.

1/20/18 by DW

### Notes

To be included in the list of clients that receive notifications, just send a message to the server. It doesn't matter what the message is, just receiving one will get you added.


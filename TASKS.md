<research>
Our electron interface should be a simple, embedded backdrop that allows a user to interact with opencode, run commands/programs (using they correct key, $ or !). The user provides input, which shows up in a chat-style interface, and any agent responses (including text, tool calls, etc.) should appaear as they happen. Our chat system (opencode) has the ability for external users (via the api) to send messages to the session, those messages, and the response from the agent should show up as well. 
The interface should be centered horizontally, with the chat input at the bottom of the window, and the messages rising above it. We should be animating the messages coming through, making it easy for a user to see what messages are occurring. 
We should have a consistent look and feel for our UI. 
We don't need a title bar or anything like that, we should keep it as simple as we can. 
We will have two windows, one is the main chat window,the other is an 'always visible' icon on the bottom-left of the window that toggles viewing the chat interface, and the rest of the app windows that appear. 
<design>
- Audit our existing setup, look at our attempt, understand what works and what doesn't work. 
- design a schematic for our main electron app window, including the app scaffolding, our general design approach, the different components we will use, and the ui libraries (e.g. shadcn, shadcn/ui, magicui, etc.). Choose the right tools for the job!
- document this design thoroughly, vet this design against standards.
<implementation>
- create an implementation plan, include: 
  - all components we need to create, including basic tests
  - the tasks to remove all of our current main window electron ui
  - the process of scaffolding our new electron app infrastructure
  - our testing strategy for building our new electron application
- The phases of delivery should be
  - basic app frame rebuilt
  - adding chat component
  - adding message (user) components
  - adding message (agent) components
  - adding tool calling (agent) components, and similar
- audit and review for next phases of work

<notes>
- 2026-01-14: Restored centered chat layout and corrected composition (messages above, input at bottom). Also made the Electron shell window fully opaque/fullscreen to avoid the "floating"/mis-centered look caused by transparent window behavior under Openbox.
- Remaining polish: tighten vertical padding in the feed/input, and fine-tune max-width/padding for different resolutions.
</notes>

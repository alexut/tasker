# TODO: Implement Predefined Tags, Actions, and Oracles

## Objective
Implement programmatically defined tags, actions, and oracles . This needs to be a deep think.

@tags(parameters) >actions(parameters) #oracle(path to reach answer)

## Requirements

1. **Tags**:
   - Define tags in the codebase to add metadata to tasks.
   - Tags may include properties like priority, category, due date, etc.
   - Ensure that tags are easily extensible for future updates.

2. **Actions**:
   - Predefine task actions to automate workflows upon task completion.
   - Examples: Read Emails,  Create Calendar Events, Move mouse 

3. **Oracles**:
   - Implement oracles to validate conditions or prerequisites for task progression.
   - Examples: 
   an oracle can be another task in a folder ( it waits for its complition )
   a date send in a unusual format is sent to an orcale that represent in in the standard way.
   an oracle can be a .json or csv resource.

4. Searc how Tags and Actions can use oracles.

